---
title: "Tensor 类“实现计划”"
date: 2026-02-13
tags: ["AI Infra"]
description: "调研各个框架的 tensor 实现，思考如何实现一个简单的 tensor"
ai_summary: >-
  这篇文章目前还是一个占位性质的学习计划，主题是调研不同框架里的 tensor 设计，并思考如何自己实现一个简化版 tensor。
ai_summary_topics:
  - Tensor 实现计划
  - 框架调研
  - 张量抽象
ai_mastery_signal: >-
  文章只体现出选题方向，尚未展开 shape、stride、storage、view、autograd 等关键机制，当前掌握深度很浅。
ai_adjacent_gap: >-
  下一步最值得补的是 tensor 元数据布局、连续与非连续存储、view/reshape 语义，以及这些设计如何影响算子实现。
ai_summary_model: gpt-5.4
ai_summary_updated_at: 2026-04-21
---

# Tensor 类“实现计划”

