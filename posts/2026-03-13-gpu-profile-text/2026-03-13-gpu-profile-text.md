---
title: "GPU 性能分析工具开发参考资料"
date: 2026-03-13
tags: ["GPU"]
description: "本人从事 GPU 性能分析工具开发工作，希望系统性学习一些原理，而不是浮于表面，故搜寻如下资料"
ai_summary: >-
  这篇文章整理了一组 GPU 性能分析学习资料，包括 CUDA Programming Guide、架构白皮书、Roofline 等，重点是给后续 profiling 原理学习建立参考入口。
ai_summary_topics:
  - GPU profiling 资料
  - Roofline
  - 架构白皮书与性能分析
ai_mastery_signal: >-
  文章本身更像资源清单，但明确暴露了学习目标：不是停留在工具操作，而是要把 profiling 指标与硬件原理联系起来。
ai_adjacent_gap: >-
  最自然的下一步是把这些资料收敛成一套自己的 profiling 方法论：看哪些指标、如何定位瓶颈、怎样验证优化前后变化。
ai_summary_model: gpt-5.4
ai_summary_updated_at: 2026-04-21
---

# GPU 性能分析工具开发参考资料

> 以下只对一些资料来源做出列举（持续更新）

## 书籍推荐

1. [CUDA Programming Guide](https://docs.nvidia.com/cuda/cuda-programming-guide/index.html)
2. [Programming Massively Parallel Processors](https://www.cse.iitd.ac.in/~rijurekha/col730_2022/cudabook.pdf)

## 重要论文推荐

1. [Nvidia's Ampere GPU Architecture](https://images.nvidia.com/aem-dam/en-zz/Solutions/data-center/nvidia-ampere-architecture-whitepaper.pdf)
2. [The Roofline Model: An Insightful Visual Performance Model for Floating-Point Programs](https://people.eecs.berkeley.edu/~kubitron/cs252/handouts/papers/RooflineVyNoYellow.pdf)
3. [Understanding Latency Hiding on GPUs](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2016/EECS-2016-143.pdf)
4. [Optimization Techniques for GPU Programming](https://dl.acm.org/doi/pdf/10.1145/3570638)

## **技术博客与官方资源**

1. [GPU编程优化综述](https://zhuanlan.zhihu.com/p/1932035570852430148)
