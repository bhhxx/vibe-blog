---
title: "agent 笔记"
date: 2026-03-08
tags: ["Agent", "note"]
description: "决定开始写博客，不弃坑"

ai_summary: >-
  这篇笔记记录了一个 Agent 框架的目录结构，把系统划分为 core、agents、tools、registry、tool chain 和 async executor 等模块。
ai_summary_topics:
  - Agent 框架目录
  - Tool registry
  - 异步执行器
ai_mastery_signal: >-
  文章体现出对 Agent 工程化分层的敏感度，知道需要把模型、消息、工具和执行器拆开，但还没有深入到协议、状态机和失败处理细节。
ai_adjacent_gap: >-
  下一步值得补的是 agent loop 的实际控制流、工具调用协议、错误恢复与验证链路，避免框架理解停留在目录结构层。
ai_summary_model: gpt-5.4
ai_summary_updated_at: 2026-04-21
---

# Agent 笔记

## 第七章 构建智能体框架

```bash
hello-agents/
├── hello_agents/
│   │
│   ├── core/                     # 核心框架层
│   │   ├── agent.py              # Agent基类
│   │   ├── llm.py                # HelloAgentsLLM统一接口
│   │   ├── message.py            # 消息系统
│   │   ├── config.py             # 配置管理
│   │   └── exceptions.py         # 异常体系
│   │
│   ├── agents/                   # Agent实现层
│   │   ├── simple_agent.py       # SimpleAgent实现
│   │   ├── react_agent.py        # ReActAgent实现
│   │   ├── reflection_agent.py   # ReflectionAgent实现
│   │   └── plan_solve_agent.py   # PlanAndSolveAgent实现
│   │
│   ├── tools/                    # 工具系统层
│   │   ├── base.py               # 工具基类
│   │   ├── registry.py           # 工具注册机制
│   │   ├── chain.py              # 工具链管理系统
│   │   ├── async_executor.py     # 异步工具执行器
│   │   └── builtin/              # 内置工具集
│   │       ├── calculator.py     # 计算工具
│   │       └── search.py         # 搜索工具
└──
```

