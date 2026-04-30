---
title: "我终于看懂了 Attention 是怎么计算的"
date: 2026-03-27
tags: ["LLM"]
description: "观察 Attention 的数据流动"
toc: true
tocDepth: 3
ai_summary: >-
  文章从 Q、K、V 的生成讲到打分、softmax、加权求和、causal mask 与 multi-head，并用一个可运行例子把 attention 的张量数据流完整走了一遍。
ai_summary_topics:
  - Attention 数学
  - Causal Mask
  - Multi-Head 与数据流
ai_mastery_signal: >-
  已经进入机制级理解：不只会背公式，还能通过具体矩阵例子解释每一步在做什么，这为后续分析 KV cache 和高性能 attention 奠定了基础。
ai_adjacent_gap: >-
  最自然的延伸是把 attention 数学映射到 IO、kernel 和显存行为，理解为什么同一个公式在推理系统里会变成性能瓶颈。
ai_summary_model: gpt-5.4
ai_summary_updated_at: 2026-04-21
---

# 我终于看懂了 Attention 是怎么计算的

## 初识 Attention is All you Need

我第一次接触 Transformer 时，记住的是架构图，但始终没真正弄明白数据是怎么在 Attention 里流动的。最近重新读了 `llm.c` 和 `LLMs-from-scratch`，才意识到，理解 Attention 最有效的方式不是反复看图，而是盯着输入张量如何一步步变成输出张量。下面我不讲历史，只讲计算。（如果你希望先看例子，请跳到后面举例说明部分）

## 再探 Attention is All you Need

我们先明确一下 Attention 层的输入和输出分别是什么

- 输入：多个 token 组成的张量，输入为 $X \in \mathbb{R}^{T \times d_{model}}$
  - $T$：序列长度，也就是 token 个数
  - $d_{model}$：每个 token 的表示维度
- 输出：对序列中的每个 token，计算它应该从自己以及其他相关 token 聚合多少信息，并形成新的表示

## 单头自注意力（single-head self-attention）

### token 产生的三个向量

对单个 token 而言，会得到三个向量：Query、Key、Value；当把整个序列放在一起看，就对应三个矩阵 $Q,K,V$。

- **Query**：我该关注谁
- **Key**：我提供什么特征供别人匹配
- **Value**：如果别人关注我，我实际提供什么信息

$$
Q = XW_Q,\quad K = XW_K,\quad V = XW_V
$$

其中：

- $W_Q \in \mathbb{R}^{d_{model} \times d_k}$
- $W_K \in \mathbb{R}^{d_{model} \times d_k}$
- $W_V \in \mathbb{R}^{d_{model} \times d_v}$

### 注意力分数的计算

**注意力分数到底怎么算**，对第 $i$ 个 token 和第 $j$ 个 token，它们的匹配分数是：
$$
s_{ij} = q_i \cdot k_j
$$
把所有 token 两两计算，就得到分数矩阵：
$$
S = QK^T
$$
当 $d_k$ 较大时，点积的数值方差会增大，softmax 更容易变得过于尖锐，因此通常要除以 $\sqrt{d_k}$ 进行缩放。
$$
S = \frac{QK^T}{\sqrt{d_k}}
$$
如果把 $Q$ 的第 $i$ 行记作 $q_i$，把 $K$ 的第 $j$ 行记作 $k_j$，那么矩阵 $QK^T$ 的第 $i,j$ 个元素就是 $q_i \cdot k_j$。也就是说，分数矩阵的第 $i$ 行表示：第 $i$ 个 token 对整个序列中所有 token 的关注程度。

### 计算注意力权重

对每一行做 softmax：
$$
A = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}} + M\right)
$$
这里 $A_{ij}$ 表示：第 $i$ 个 token 应该从第 $j$ 个 token 读取多少信息。

### 计算聚合表示

最后用这些权重对 $V$ 做加权求和：
$$
O = AV
$$
其中 $O \in \mathbb{R}^{T \times d_v}$。

## 因果掩码自注意力（causal self-attention）

因果掩码自注意力

在语言模型生成场景中，第 $i$ 个 token 不应该看到未来 token 的信息，因此在分数矩阵 $S$ 上加一个上三角 mask。被遮住的位置设为一个极小值，如 $-\infty$，再做 softmax。
$$
A = \text{softmax}\left(\frac{QK^T + M}{\sqrt{d_k}}\right)
$$
其中 $M$ 是 mask 矩阵，未来位置为 $-\infty$，其他位置为 0。

这样 softmax 之后，未来 token 对应的权重就会变成 0，因此每个位置只能关注自己及之前的位置。

## 多头自注意力（multi-head self-attention）

单头 attention 只在一个表示子空间里做信息聚合。多头 attention 的做法是，用多组不同的投影矩阵，把输入映射到多个不同的子空间中，分别计算 attention，再把各头结果拼接起来。

对第 $h$ 个头：
$$
Q^{(h)} = XW_Q^{(h)},\quad K^{(h)} = XW_K^{(h)},\quad V^{(h)} = XW_V^{(h)}
$$
每个头独立计算：
$$
\text{head}_h = \text{softmax}\left(\frac{Q^{(h)}K^{(h)T}}{\sqrt{d_k}}\right)V^{(h)}
$$
最后：
$$
\text{MultiHead}(X) = \text{Concat}(\text{head}_1, \dots, \text{head}_H)W_O
$$
其中 $W_O$ 把拼接后的结果映射回 $d_{model}$ 维。

## 举例说明

我将选取 **因果掩码自注意力** 来说明整个计算过程。

### 输入

```python
import torch
inputs = torch.tensor(
  [[0.43, 0.15, 0.89], # Your     (x^1)
   [0.55, 0.87, 0.66], # journey  (x^2)
   [0.57, 0.85, 0.64], # starts   (x^3)
   [0.22, 0.58, 0.33], # with     (x^4)
   [0.77, 0.25, 0.10], # one      (x^5)
   [0.05, 0.80, 0.55]] # step     (x^6)
)
```

这里一共有 6 个 token，每个 token 是一个 3 维向量，因此：

- 序列长度 $T=6$
- 输入维度 $d_{in}=3$

为了把注意力集中在 attention 本身的计算流程上，这里先固定一组最简单的投影矩阵：
$$
W_Q = W_K = W_V = I_3
$$
也就是说，Query、Key、Value 都直接等于输入本身：
$$
Q = X,\quad K = X,\quad V = X
$$
因此：

```
W_Q = torch.eye(3)
W_K = torch.eye(3)
W_V = torch.eye(3)

Q = inputs @ W_Q
K = inputs @ W_K
V = inputs @ W_V
```

所以：
$$
Q = K = V =
\begin{bmatrix}
0.43 & 0.15 & 0.89 \\
0.55 & 0.87 & 0.66 \\
0.57 & 0.85 & 0.64 \\
0.22 & 0.58 & 0.33 \\
0.77 & 0.25 & 0.10 \\
0.05 & 0.80 & 0.55
\end{bmatrix}
$$

------

### 第一步：计算分数矩阵

因为这里 $d_k=3$，所以缩放后的注意力分数矩阵为：
$$
S = \frac{QK^T}{\sqrt{3}}
$$
对应代码：

```python
scores = Q @ K.T / (K.shape[-1] ** 0.5)
```

数值上，约等于：
$$
S \approx
\begin{bmatrix}
0.577 & 0.551 & 0.544 & 0.274 & 0.264 & 0.364 \\
0.551 & 0.863 & 0.852 & 0.487 & 0.408 & 0.627 \\
0.544 & 0.852 & 0.841 & 0.479 & 0.413 & 0.612 \\
0.274 & 0.487 & 0.479 & 0.285 & 0.201 & 0.379 \\
0.264 & 0.408 & 0.413 & 0.201 & 0.384 & 0.169 \\
0.364 & 0.627 & 0.612 & 0.379 & 0.169 & 0.546
\end{bmatrix}
$$
这个矩阵的第 $i$ 行表示：第 $i$ 个 token 对所有 token 的原始匹配分数。

比如第 2 个 token（`journey`）对第 1 个 token（`Your`）的分数是：
$$
s_{21} = \frac{x^{(2)} \cdot x^{(1)}}{\sqrt{3}}
= \frac{0.55\cdot0.43 + 0.87\cdot0.15 + 0.66\cdot0.89}{\sqrt{3}}
\approx 0.551
$$
而它对自己的分数是：
$$
s_{22} = \frac{x^{(2)} \cdot x^{(2)}}{\sqrt{3}} \approx 0.863
$$
这说明第 2 个 token 当前更“匹配”自己，而不是第 1 个 token。

### 第二步：加上因果掩码

由于是语言模型中的 causal self-attention，第 $i$ 个 token 不能看到未来位置，所以要加上一个上三角 mask：
$$
M =
\begin{bmatrix}
0 & -\infty & -\infty & -\infty & -\infty & -\infty \\
0 & 0 & -\infty & -\infty & -\infty & -\infty \\
0 & 0 & 0 & -\infty & -\infty & -\infty \\
0 & 0 & 0 & 0 & -\infty & -\infty \\
0 & 0 & 0 & 0 & 0 & -\infty \\
0 & 0 & 0 & 0 & 0 & 0
\end{bmatrix}
$$
对应代码：

```python
T = scores.shape[0]
mask = torch.triu(torch.ones(T, T), diagonal=1)
scores = scores.masked_fill(mask.bool(), float("-inf"))
```

加上 mask 后，分数矩阵变成：
$$
S_{\text{masked}} \approx
\begin{bmatrix}
0.577 & -\infty & -\infty & -\infty & -\infty & -\infty \\
0.551 & 0.863 & -\infty & -\infty & -\infty & -\infty \\
0.544 & 0.852 & 0.841 & -\infty & -\infty & -\infty \\
0.274 & 0.487 & 0.479 & 0.285 & -\infty & -\infty \\
0.264 & 0.408 & 0.413 & 0.201 & 0.384 & -\infty \\
0.364 & 0.627 & 0.612 & 0.379 & 0.169 & 0.546
\end{bmatrix}
$$

------

### 第三步：对每一行做 softmax，得到注意力权重

$$
A = \text{softmax}(S_{\text{masked}})
$$

对应代码：

```python
attn_weights = torch.softmax(scores, dim=-1)
```

得到的注意力权重大约是：
$$
A \approx
\begin{bmatrix}
1.000 & 0     & 0     & 0     & 0     & 0 \\
0.423 & 0.577 & 0     & 0     & 0     & 0 \\
0.270 & 0.367 & 0.363 & 0     & 0     & 0 \\
0.223 & 0.276 & 0.274 & 0.226 & 0     & 0 \\
0.186 & 0.215 & 0.216 & 0.174 & 0.210 & 0 \\
0.151 & 0.197 & 0.194 & 0.153 & 0.124 & 0.181
\end{bmatrix}
$$
这个矩阵就是真正的“读信息比例”。

例如第 2 行：
$$
[0.423,\ 0.577,\ 0,\ 0,\ 0,\ 0]
$$
表示第 2 个 token 在更新自己时：

- 从第 1 个 token 读取约 42.3% 的信息
- 从自己读取约 57.7% 的信息
- 完全不能读第 3 到第 6 个 token，因为它们属于未来位置

### 第四步：对 Value 加权求和，得到输出

最后计算：
$$
O = AV
$$
对应代码：

```python
context_vec = attn_weights @ V
```

结果约为：
$$
O \approx
\begin{bmatrix}
0.430 & 0.150 & 0.890 \\
0.499 & 0.566 & 0.757 \\
0.525 & 0.668 & 0.715 \\
0.454 & 0.638 & 0.631 \\
0.521 & 0.551 & 0.524 \\
0.422 & 0.623 & 0.551
\end{bmatrix}
$$
其中第 2 个 token 的输出向量可以展开写成：
$$
o_2 = 0.423\,x^{(1)} + 0.577\,x^{(2)}
$$
代入数值：
$$
o_2
=
0.423
\begin{bmatrix}
0.43 \\ 0.15 \\ 0.89
\end{bmatrix}
+
0.577
\begin{bmatrix}
0.55 \\ 0.87 \\ 0.66
\end{bmatrix}
\approx
\begin{bmatrix}
0.499 \\ 0.566 \\ 0.757
\end{bmatrix}
$$
这就说明：**attention 的输出，本质上是“当前位置对过去若干 token 的 Value 做加权平均”。**

### 从这个例子里可以直接看出什么

- 第一，第 1 个 token 只能看到自己，所以它的输出和输入完全一样：

$$
o_1 = x^{(1)}
$$

- 第二，第 2 个 token 只能在前两个 token 中分配注意力，所以它的输出是 $x^{(1)}$ 和 $x^{(2)}$ 的加权和。

- 第三，越靠后的 token，可参考的信息越多。比如第 6 个 token 的权重分布是：

$$
[0.151,\ 0.197,\ 0.194,\ 0.153,\ 0.124,\ 0.181]
$$

- 说明它会综合前面所有 token，再形成自己的新表示。

### 一段可直接运行的完整代码

```python
import torch

inputs = torch.tensor(
  [[0.43, 0.15, 0.89],
   [0.55, 0.87, 0.66],
   [0.57, 0.85, 0.64],
   [0.22, 0.58, 0.33],
   [0.77, 0.25, 0.10],
   [0.05, 0.80, 0.55]]
)

# 为了专注 attention 计算流程，这里固定成单位阵
W_Q = torch.eye(3)
W_K = torch.eye(3)
W_V = torch.eye(3)

Q = inputs @ W_Q
K = inputs @ W_K
V = inputs @ W_V

# scaled dot-product attention
scores = Q @ K.T / (K.shape[-1] ** 0.5)

# causal mask
T = scores.shape[0]
mask = torch.triu(torch.ones(T, T), diagonal=1)
scores = scores.masked_fill(mask.bool(), float("-inf"))

# attention weights
attn_weights = torch.softmax(scores, dim=-1)

# output
context_vec = attn_weights @ V

print("Q =\n", Q)
print("K =\n", K)
print("V =\n", V)
print("attention scores =\n", scores)
print("attention weights =\n", attn_weights)
print("context vectors =\n", context_vec)
```

## 参考资料

- [Attention is All you Need](https://arxiv.org/abs/1706.03762)
- [一个 c 语言写的简化大模型训练推理过程](https://github.com/karpathy/llm.c)
- [从零构建大模型](https://github.com/rasbt/LLMs-from-scratch)
- [周奕帆关于 Attention 的解读](https://zhouyifan.net/2022/11/12/20220925-Transformer/)
- GPT-5.4 的帮助
- [大佬的经历](https://blog.youxu.info/2026/01/14/ai-codes-retrospective/)：曾在 Attention 出来之前在硅谷创业，做代码生成，用的是 LSTM。他曾和 Illia 一起探讨过代码生成，Illia 也就是后来 Attention 的作者之一。





