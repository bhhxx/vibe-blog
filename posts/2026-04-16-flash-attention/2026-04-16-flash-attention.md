---
title: "深入理解 FlashAttention：分块、算子融合与重计算的艺术"
date: 2026-04-16
tags: ["AI Infra"]
description: "从 IO-aware 角度理解 FlashAttention-1 的核心思路"
toc: true
tocDepth: 3
ai_summary: >-
  文章从 IO-aware 视角解释 FlashAttention-1：通过 tiling、online softmax、算子融合和重计算，避免把完整的 score/probability 矩阵写回 HBM，从而减少显存与 IO 开销。
ai_summary_topics:
  - FlashAttention
  - Online Softmax
  - IO-aware Tiling
ai_mastery_signal: >-
  这篇文章体现出较强的机制推导能力，已经能把 attention 数学、GPU 存储层级和 wall-clock 性能联系起来，而不是只停留在“它更快”这种结论。
ai_adjacent_gap: >-
  下一步最值得补的是 kernel 级实现细节、并行分工、反向传播处理，以及 FlashAttention-2/3 与实际推理/训练框架的集成差异。
ai_summary_model: gpt-5.4
ai_summary_updated_at: 2026-04-21
---

# 深入理解 FlashAttention：分块、算子融合与重计算的艺术

很多人第一次接触 FlashAttention 时，会直觉以为它的本质是“少算了很多”。但如果只聚焦 FlashAttention-1 的核心思路，更准确的说法其实是：**它主要不是靠少做多少数学运算，而是靠少搬运那些本来会反复进出 HBM 的中间结果。**

这篇笔记只讨论 FlashAttention-1 的核心思路。它并没有把 exact attention 的总体计算复杂度从 $O(N^2)$ 变成线性，而是通过 IO-aware 的分块计算和算子融合，避免显式实例化完整的 $N \times N$ 中间矩阵，从而显著降低 attention 计算中的额外显存占用和 HBM 读写。

理解 FlashAttention，需要抓住三个问题：标准 Attention 慢在哪、Softmax 为什么阻碍分块、Online Softmax 如何让流式累加成立。下面按这个顺序展开。

## 前置知识与硬件背景

### Attention 的核心计算

标准 Attention 机制的计算可以拆成三个阶段：**两次矩阵乘法**和**一次 Softmax**。给定 Query（$Q$）、Key（$K$）和 Value（$V$），计算公式如下：

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d}}\right)V
$$

展开来看，它需要：

- **$S = QK^T$**：两个大矩阵相乘，得到相似度矩阵 $S$（大小为 $N \times N$）。
- **$P = \text{softmax}(S)$**：对相似度矩阵 $S$ 的每一行进行 Softmax 归一化，得到权重矩阵 $P$。
- **$O = PV$**：权重矩阵 $P$ 再与矩阵 $V$ 相乘，得到最终输出。

### 硬件层级的内存架构

要理解 FlashAttention 为什么快，必须先看 GPU 的数据搬运成本。在 GPU 上，算得快不等于整体就快；很多时候真正拖慢速度的是不同存储层级之间的读写。

为了方便理解，这里只抓最重要的快慢层级，而不强行区分所有架构细节。内存大致可以理解为从慢到快、从大到小：

- **HBM（High Bandwidth Memory，即显存）**：容量大，但相对片上高速存储更慢，更容易成为瓶颈。
- **片上高速存储（如 Shared Memory / SRAM / Cache）**：容量远小于 HBM，但带宽更高、延迟更低，适合暂存计算中的小块数据。
- **寄存器（Registers）**：离计算单元最近，速度最快，但容量最小。

**核心矛盾**：寄存器和片上高速存储的容量都很有限，**显然不可能一次性把一整个庞大的 $Q, K, V$ 全部放进去做矩阵乘法**。因此，在硬件底层，大矩阵乘法本来就是按小块（Tiling / Block）分批搬运、分批计算、最后再拼接结果的。

## 朴素 Attention 计算与优化需求

### 朴素 Attention 的计算流程

在传统深度学习框架中，哪怕底层的 MatMul 已经做了分块，算子（operator）之间依然会发生大量全量内存交互。朴素 Attention 通常是拆开调用的：

- 框架调用一个 MatMul 算子计算 $S = QK^T$。分块算完后，会把完整的 $N \times N$ score 矩阵 $S$ 写回 **HBM**。
- 框架再调用一个 Softmax 算子，从 **HBM** 读出 $S$，算完后再把同样是 $N \times N$ 的权重矩阵 $P$ 写回 **HBM**。
- 框架最后调用一个 MatMul 算子，从 **HBM** 读出 $P$ 和 $V$，算出最终结果并写回 **HBM**。

### 优化需求：打破中间矩阵的 IO 瓶颈

**瓶颈显而易见**：中间矩阵 $S$ 和权重矩阵 $P$ 的大小都是 $O(N^2)$。当序列长度 $N$ 变大时，问题不只是占显存，更致命的是这些大矩阵被反复写回和读出 HBM，导致 attention 很容易变成 **memory-bound**：算力明明很强，但大把时间花在等数据搬运。

这里要优化的重点，并不是把 exact attention 的理论计算量直接降成线性，而是减少中间矩阵的 materialization 和 HBM IO。于是，一个很自然的想法出现了：**算子融合（operator fusion）**。

能不能把这三步捏成一步？也就是在片上高速存储里算出一小块 $S$ 后，**别写回 HBM**，而是直接在片上完成这小块对应的 Softmax 和与 $V$ 的乘法，最后只把最终输出块写回 HBM。

**但这里有一个关键障碍**：传统 Softmax 需要看完整一行的所有元素，才能得到归一化分母。而分块计算时，片上高速存储里只有这一小块 score，拿不到整行的全部信息。

为了解决这个矛盾，关键就落到了 **Softmax 的在线计算** 上，这也是 FlashAttention-1 能成立的数学基础。

## Softmax 基础与优化

下面只解决一个问题：**当一整行 score 被拆成多个块后，Softmax 的全局最大值和归一化分母如何在“看不全整行”的情况下仍然被正确维护？**

### Standard Softmax

Softmax 的作用是把一组实数转成概率分布，使得每个元素都在 $(0, 1)$ 之间，且总和为 1。数学公式为：

$$
\text{softmax}(x_i) = \frac{e^{x_i}}{\sum_{j=1}^{N} e^{x_j}}
$$

**计算瓶颈**：如果只看最朴素的实现，通常需要两次遍历：

- 第一次遍历：计算分母 $Z = \sum_{j=1}^{N} e^{x_j}$
- 第二次遍历：计算每个元素的输出 $\frac{e^{x_i}}{Z}$

### Safe Softmax

由于指数函数 $e^x$ 增长很快，当 $x_i$ 较大时，容易发生数值上溢（overflow）。常见做法是先减去整行最大值 $m = \max(x)$：

$$
\text{softmax}(x_i) = \frac{e^{x_i - m}}{\sum_{j=1}^{N} e^{x_j - m}}
$$

这样不会改变 Softmax 的结果，因为分子分母同乘了 $e^{-m}$。但最大的指数会变成 $e^0 = 1$，从而避免上溢。较小项可能下溢到 0，不过在 Softmax 语境里，这通常是安全的，因为这些值本来就接近 0。

**计算瓶颈**：Safe Softmax 通常需要三次遍历（或者至少三次主要内存访问）：

- 遍历找到最大值 $m$
- 遍历计算归一化分母 $Z = \sum_{j=1}^{N} e^{x_j - m}$
- 遍历计算最终结果 $\frac{e^{x_i - m}}{Z}$

### Online Softmax

Safe Softmax 数值安全，但需要多次遍历。同样的数据，如果能少读几遍，在 GPU 上往往就能更快。**Online Softmax 的目标，就是在单次流式遍历中维护 Softmax 所需的统计量。**

先看单行、单元素版本的推导。假设我们已经处理了前 $i-1$ 个元素，当前维护着：

- $m_{i-1} = \max(x_1, \dots, x_{i-1})$
- $l_{i-1} = \sum_{j=1}^{i-1} e^{x_j - m_{i-1}}$

当新元素 $x_i$ 到来时，可以增量更新为：

- **更新最大值**：

$$
m_i = \max(m_{i-1}, x_i)
$$

- **修正并更新归一化分母**：

$$
l_i = l_{i-1} \times e^{m_{i-1} - m_i} + e^{x_i - m_i}
$$

关键在第二步：如果新的最大值变大了，旧的指数和是基于旧最大值算的，就必须先按 $e^{m_{i-1} - m_i}$ 缩放到新的坐标系里，再把当前元素的贡献加进去。

通过这种增量更新，我们可以在单次遍历中维护全局最大值 $m$ 和归一化分母 $l$。把这个思路从“单元素流式更新”推广到“按块处理一整行 score”，就是 FlashAttention 里 Online Softmax 的核心。

## 初版 FlashAttention（FlashAttention-1）推导

FlashAttention 的核心思想是 **Tiling（分块计算）** 和 **Recomputation（重计算）**。

目标不是改变 exact attention 的二次计算本质，而是尽可能减少 HBM 读写，把中间计算留在速度极快的片上高速存储里，从而避免显式实例化 $O(N^2)$ 的中间矩阵 $S$ 和 $P$。

### Tiling（分块机制）

为了不把庞大的 $O(N^2)$ 矩阵整体写入 HBM，我们将输入矩阵 $Q, K, V$ 切成小块（blocks），逐块加载到片上高速存储中计算。

- 外层循环遍历 $Q$ 的块。
- 内层循环遍历 $K$ 和 $V$ 的块。
- 每次只在片上保留当前需要的 score tile、局部统计量和输出 tile。

### 结合 Online Softmax 计算 Attention

把 Online Softmax 从“单元素”推广到 FlashAttention 时，本质上是：**对一个 Query 块中的每一行，分别维护一组运行中的统计量**，而不是对整个块只维护一个标量。

换句话说，单元素版本里维护的是一个标量形式的 $(m, l)$；到了块级版本，维护对象变成了“一个 Query 块内每一行各自的 $(m, l)$”，更新方式则从标量加法变成按行广播的向量/矩阵运算。与此同时，FlashAttention 不再打算先把完整概率矩阵 $P$ 算完再乘 $V$，而是把“权重更新”和“乘上 $V$”合并成对输出的在线累加。

假设当前处理的 Query 块为 $Q_i \in \mathbb{R}^{B_r \times d}$，当前加载的 Key / Value 块为 $K_j, V_j \in \mathbb{R}^{B_c \times d}$。

对于 $Q_i$ 中的每一行，我们维护：

- $m_i^{(j)} \in \mathbb{R}^{B_r}$：处理到第 $j$ 个 $K/V$ 块后，每一行见过的最大 score
- $l_i^{(j)} \in \mathbb{R}^{B_r}$：对应每一行的 running normalizer
- $\tilde O_i^{(j)} \in \mathbb{R}^{B_r \times d}$：对应每一行当前累计的**未归一化**输出

初始化为：

$$
m_i^{(0)} = -\infty,\qquad
l_i^{(0)} = 0,\qquad
\tilde O_i^{(0)} = 0
$$

内层循环遍历每一个 $(K_j, V_j)$ 块时：

- **计算局部 score tile**：

$$
S_{ij} = Q_i K_j^T
$$

为了突出核心推导，这里先省略 $\frac{1}{\sqrt d}$ 缩放；实际实现中会包含该因子。

- **计算当前 tile 的按行最大值**：

$$
\tilde m_{ij} = \operatorname{rowmax}(S_{ij})
$$

- **更新每一行的全局最大值**：

$$
m_i^{(j)} = \max\left(m_i^{(j-1)}, \tilde m_{ij}\right)
$$

这里的 $\max$ 是按元素进行的，也就是逐行更新。

- **计算当前 tile 的指数权重并更新分母**：

$$
\tilde P_{ij} = e^{S_{ij} - m_i^{(j)}}
$$

$$
l_i^{(j)} = l_i^{(j-1)} \odot e^{m_i^{(j-1)} - m_i^{(j)}} + \operatorname{rowsum}(\tilde P_{ij})
$$

这里的减法和指数缩放都是按行广播，$\odot$ 表示按元素相乘。

这一步和单元素 Online Softmax 的逻辑完全一样：一旦某一行的最大值被当前 tile 刷新了，历史上那一行累积的归一化分母就不再处在正确的参考系里，必须先乘上 $e^{m_i^{(j-1)} - m_i^{(j)}}$ 做重标定，再与当前 tile 的贡献相加。

- **更新未归一化输出**：

$$
\tilde O_i^{(j)} =
\operatorname{diag}\left(e^{m_i^{(j-1)} - m_i^{(j)}}\right)\tilde O_i^{(j-1)} + \tilde P_{ij} V_j
$$

含义和更新 $l_i$ 一样：如果新的最大值变大了，先把历史贡献按行缩放到新的坐标系里，再加上当前块的贡献。

为什么 $\tilde O_i^{(j-1)}$ 也要乘同一个缩放因子？因为它本质上也是“以当前最大值为参考系”累计出来的未归一化加权和；既然参考系变了，历史输出贡献也必须一起重标定，否则最终再除以 $l_i^{(\text{final})}$ 时就不再和 Softmax 的定义对应。

当内层所有的 $K, V$ 块都处理完后，再对每一行做最终归一化：

$$
O_i = \operatorname{diag}\left(l_i^{(\text{final})}\right)^{-1} \tilde O_i^{(\text{final})}
$$

等价地，也可以理解为：**把 $\tilde O_i^{(\text{final})}$ 的每一行除以对应的 $l_i^{(\text{final})}$**。

**核心洞察与本质区别**：

如果目标只是单独算出完整的 Softmax 概率矩阵 $P$，那么 Online Softmax 仍然需要先拿到整行的全局统计量，再回头生成最终概率，因此很难彻底省掉对完整 $P$ 的处理。

而 FlashAttention 的关键观察是：**我们真正需要的是最终输出 $O = PV$，而不是把完整的 $P$ 先显式存下来。** 因此，它把“算出所有权重”与“乘上 $V$”这两步融合成了对输出的在线累加。

所以，FlashAttention 省掉的不是 Softmax 的数学约束，而是**显式 materialize 完整 $N \times N$ 权重矩阵并把它反复写回 / 读出 HBM** 这件极其昂贵的事。

**结论**：FlashAttention-1 的核心思路不是把完整的 $N \times N$ 中间矩阵 $S$ 和 $P$ 显式 materialize 到 HBM；片上短暂存在的只是局部 score tile 和局部权重 tile。

### Recomputation（重计算）

在反向传播（backward pass）里，标准做法通常要依赖前向传播保存的中间矩阵 $S$ 和 $P$。但 FlashAttention 的核心策略恰恰是不保存这些 $O(N^2)$ 中间结果，那怎么办？答案是：**需要时再算一遍。**

- 前向传播时，FlashAttention 核心上只需保存输出以及按行的 Softmax 统计量（如 $m$ 和 $l$），而不需要保存完整的 $S$ 和 $P$。从 attention 内核视角看，如果把 head dimension 视为常数，那么这类额外工作区 / 中间状态可近似看作从 $O(N^2)$ 降到了 $O(N)$。
- 反向传播时，利用保存下来的 $m$ 和 $l$，重新在片上按块算出所需的局部 score 和局部权重，再继续求梯度。
- 这样做会增加一些 FLOPs，但 FlashAttention 论文要验证的核心论点正是：在 GPU 上，省掉大规模 HBM 读写往往比少做那部分算术更重要，因此 wall-clock 时间反而可能更快。

这里也要特别注意一个边界：**FlashAttention 降低的是中间矩阵带来的额外显存和 IO 压力，不是把 exact attention 的总体计算复杂度改成线性。** 上面提到的 $O(N)$，说的是额外中间状态随序列长度的增长方式，而不是总 FLOPs。

## 总结

如果只看公式，FlashAttention-1 像是在“把 Attention 分块来算”；但它真正的关键不只是分块，而是：

- 用 Online Softmax 在“看不完整一行”的前提下，仍然正确维护每一行的归一化统计量；
- 把 Softmax 和 $PV$ 融合成对输出的在线更新，避免显式生成完整的注意力权重矩阵；
- 在反向传播中用重计算换取更少的中间存储和更低的 IO 成本。

因此，FlashAttention-1 的核心收益可以更准确地表述为：**在不改变 exact attention 二次计算本质的前提下，避免 materialize $N \times N$ 中间矩阵，显著降低 attention 计算中的额外显存占用和 HBM IO。**

后续版本（如 FA2 等）在此基础上继续做更激进的并行划分、work partitioning 和硬件指令级优化，但“按块处理 + 在线归一化 + 尽量不落 HBM”的主线是一脉相承的。

## 参考文档

- [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135)
- [Online normalizer calculation for softmax](https://arxiv.org/abs/1805.02867)
- [FlashAttention official repository](https://github.com/Dao-AILab/flash-attention)
- [online-softmax（中文补充材料）](https://zhuanlan.zhihu.com/p/5078640012)
- [FlashAttention（中文补充材料）](https://zhuanlan.zhihu.com/p/663932651)
