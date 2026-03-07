---
title: "什么是流式多处理器"
date: 2026-03-01
tags: ["GPU"]
description: "了解流式多处理器的架构"
---

# 深入 GPU 的“心脏”：什么是流式多处理器？

当我们谈论显卡（GPU）的强大性能时，我们实际上是在谈论它内部成百上千个微小计算核心的协同工作。要真正理解 GPU 为何能驱动庞大的 AI 模型，我们需要把目光聚焦在 GPU 最基本的执行单元——**流式多处理器 (Streaming Multiprocessor，简称 SM)**。

在深入探讨之前，为了方便大家理解，我们先统一一下文中出现的专业术语：

## 名词科普

- SM，Streaming Multiprocessor，流式多处理器
- GPU，Graphics Process Unit，图形处理器单元
- GPC，Global Processor Cluster，全局处理器集群
- Tensor Core，张量核心
- SFU，Special Function Unit，特殊函数单元

## SM 之于 GPU

下面先通过图解找到 [GA100 架构](https://images.nvidia.com/aem-dam/en-zz/Solutions/data-center/nvidia-ampere-architecture-whitepaper.pdf) 的 SM 在 GPU 中的位置。**如果把一颗 GPU 比作一座现代化的工业园区，那么 SM 就是其中最核心的“生产车间”。** 下面我们通过 GA100 架构的拆解图，由表及里地观察 SM 在 GPU 系统中的层级位置。如下图所示，架构的递进关系为：**GA100 全局图 $\rightarrow$ GPC 局部图 $\rightarrow$ SM 内部架构图。**

<img src="https://cloudflare-imgbed-6iw.pages.dev/file/1772346358518_ga100-gpc-sm.png" alt="ga100-gpc-sm.png" width=100% />

从宏观架构图上看，我们知道了 GPU 中有很多 SM。走进这个“生产车间”，你会发现其内部构造极其精密。为了高效完成计算任务，SM 内部被划分为三大功能区（本文不关注图像处理，只关注通用计算部分 ）。

## SM 的内部构造，即硬件排布

### 核心生产区—— “流水线工人”

这是真正干活的地方，不同类型的核心各司其职：

- CUDA Cores（通用工人）：有 INT32（32位整数单元）、FP32（单精度浮点单元）、FP64（双精度浮点单元）
- Tensor Cores（AI 专家）：专门用来加速深度学习中的矩阵乘法（$A \times B + C$）。
- SFU（数学家）：处理超越函数（sin，cos，exp，log）

### 指挥与调度区—— “车间管理层”

光有工人是不够的，还需要高效的管理层来分发任务：

- Warp Scheduler：它的核心能力是 Latency Hiding（延迟掩盖）。当一组线程在等待内存数据（休息）时，Scheduler 能够瞬间切换到另一组准备好的线程去执行，保证计算单元不闲置。
- Dispatch Unit：负责把工头的命令翻译成具体的电信号，发给下面的各种计算单元。
- L0 Instruction Cache： 存放最近要执行的任务清单（指令），让调度器能瞬间拿到命令。

### 存储与物流区—— “仓库与物流”

这一区域负责数据的存放和搬运，确保生产线“粮草充足”：

- Register File（寄存器）：离工人最近、速度最快的仓库。
- LD/ST：负责数据搬运的装卸工。
- 192KB L1 Data Cache / Shared Memory：这是 SM 的“片上内存”，速度比外部显存（Global Memory）快几十倍，是优化 CUDA 程序的关键所在。

## SM 执行指令

了解了 SM 内部的“工人”、“管理层”和“仓库”之后，我们来看看当一个计算任务下发时，这座工厂究竟是如何运转的。

### 组队进场：Warp（线程束）的诞生

在 CPU 的世界里，往往是一个工人领一张图纸（指令）单独干活。但在 GPU 的 SM 工厂里，为了追求极致的吞吐量，工人必须“集体行动”。

- 打包分组： 当任务到达 SM 时，管理层会将每 32 个线程（Threads）打包成一个基本执行单元，这就叫 Warp（线程束）。

- 动作整齐划一： 这 32 个“工人”在同一时刻，只能执行同一种动作（比如都是做加法，或者都是读取内存）。区别在于，他们每个人处理的数据（原材料）不同。

### 流水线分发

当调度器选定了一个准备好执行的 Warp 后，Dispatch Unit（分发单元） 会根据指令类型，将任务分发给对应的专职区域：

- 普通算术题： 发给 CUDA Cores。
- 矩阵大运算： 发给 Tensor Cores（AI 专家）。这是现代 AI 推理和训练速度飞跃的关键，它能在一个周期内完成整个 $4\times4$ 矩阵的乘加运算，而不是像普通 Core 那样一次算一个数。
- 复杂函数： 发给 SFU（数学家）。
- 存取数据： 发给 LD/ST（装卸工）。

### 核心魔法：延迟掩盖

这是 SM 能够实现恐怖算力的秘密武器。

在计算过程中，最怕的就是“等”。比如，当一个 Warp 需要从显存（Global Memory）读取数据时，由于距离太远，这通常需要几百个时钟周期。如果让 CUDA Cores 傻等着数据回来，那就是巨大的产能浪费。

这时候，Warp Scheduler（车间调度器） 的神级操作就来了：

1. 遇阻即切： 当 Warp A 发出读取内存请求并开始等待时，调度器不需要任何“切换成本”，瞬间就会把指令流切换到 Warp B。
2. 无缝衔接： 让 Warp B 利用刚才空闲下来的计算单元（CUDA Cores）继续干活。
3. 循环往复： 如果 Warp B 也卡住了，就切给 Warp C……直到 Warp A 的数据运到了，再切回 Warp A 继续计算。

只要 SM 里堆积的 Warp 足够多，调度器就能保证计算单元（工人）永远处于“满负荷运转”状态，完全掩盖了漫长的内存等待时间。

### 结果回写

计算完成后，结果不会直接扔回遥远的显存，而是优先写回 Register File（寄存器） 或 L1 Cache/Shared Memory。这就像工人做完零件，先顺手放在手边的周转箱里，以便下一个步骤直接拿来用，极大地减少了物流时间。
