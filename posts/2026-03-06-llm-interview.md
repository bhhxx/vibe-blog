---
title: "LLM Interview"
date: 2026-03-07
tags: ["LLM"]
description: "大模型面经"
ai_summary: >-
  文章汇总了一组大模型方向的面试题，覆盖 attention、SFT 与 post-training、RAG、Agent、工具调度、评估体系和链路延迟优化等话题。
ai_summary_topics:
  - 面经题库
  - Post-Training / RAG
  - Agent 系统设计
ai_mastery_signal: >-
  这更像能力地图而不是知识展开，说明已经意识到大模型岗位常见问题面向哪些子系统，但还看不出逐题推导和工程权衡深度。
ai_adjacent_gap: >-
  最值得补的是挑几类高频题做机制级回答，尤其是 post-training、RAG 评估、Agent latency 优化和工具调度策略。
ai_summary_model: gpt-5.4
ai_summary_updated_at: 2026-04-21
---

# LLM Interview

## 阿里淘天

https://www.nowcoder.com/feed/main/detail/78d6c8c30f1741e6b0a1a02d7b4bbfab?sourceSSR=search

Transformer 中 Attention 的本质是什么？你能从数学角度简要解释一下吗？

1. 在Agent多轮对话任务中，你觉得Attention的局限性体现在哪些方面？
2. 简要介绍一下SFT的核心流程，以及数据集的构建策略，SFT之后常见的Post-Training还有哪些？它们之间的目的有何区别？
3. 什么是RAG，它是怎么提升生成质量的？与传统检索＋模型生成的流程有何不同？如何评估一个RAG系统是否work的？
4. PPO和DPO在大模型对齐中的主要区别是什么？DPO训练通常有哪些注意事项？用过GRPO么？
5. 项目里的Modular Agent，你能讲讲它是如何实现多步规划的吗？
6. 项目提到了多个工具调用链路，调度策略是如何设计的？是否有异常fallback策略？
7. Agent评估体系包括哪些维度？如何衡量planning能力 vs hallucination rate？
8. 项目里微调Qwen，选择的训练阶段和Loss函数是如何决定的？
9. Prompt自动推荐模块用了哪些优化策略？有没有尝试过Prompt压缩或embedding表示的方式？
10. 场景题：假如一个Agent 推理链路包含3个工具+高频请求，系统整体延迟较高，你会如何优化？
11. 代码：岛屿数量
