# DeerFlow 项目完整讲解

> 本文档面向代码小白，用通俗易懂的语言讲解 DeerFlow 项目的每一个角落。
> 所有专业名词都会在第一次出现时给出解释。

---

## 目录

- [第一部分：项目总览](#第一部分项目总览)
  - [DeerFlow 是什么](#deerflow-是什么)
  - [核心概念通俗解释](#核心概念通俗解释)
  - [整体架构](#整体架构)
  - [技术栈一览](#技术栈一览)
- [第二部分：项目目录树](#第二部分项目目录树)
- [第三部分：根目录文件讲解](#第三部分根目录文件讲解)
- [第四部分：backend/ 后端讲解](#第四部分backend-后端讲解)
  - [app/gateway/ — API 网关](#appgateway--api-网关)
  - [app/channels/ — 即时通讯渠道](#appchannels--即时通讯渠道)
  - [packages/harness/deerflow/ — 核心引擎](#packagesharnessdeerflow--核心引擎)
- [第五部分：frontend/ 前端讲解](#第五部分frontend-前端讲解)
- [第六部分：docker/ 部署讲解](#第六部分docker-部署讲解)
- [第七部分：scripts/ 脚本讲解](#第七部分scripts-脚本讲解)
- [第八部分：skills/ 技能讲解](#第八部分skills-技能讲解)
- [第九部分：核心流程讲解](#第九部分核心流程讲解)

---

## 第一部分：项目总览

### DeerFlow 是什么

DeerFlow 的全称是 **Deep Exploration and Efficient Research Flow**（深度探索与高效研究流程）。
它是字节跳动开源的一个 **super agent harness**（超级智能体框架）。

**通俗理解**：DeerFlow 就像一个"AI 管家平台"。你在网页上跟它聊天，它背后有一个"主管 AI"（lead agent），这个主管可以：
- 调用各种**工具**（比如搜索网页、执行代码、读写文件）
- 派出**子智能体**（sub-agent）去做具体的子任务
- 拥有**长期记忆**，记住你的偏好和上下文
- 在安全的**沙箱**环境里运行代码，不会搞坏你的电脑
- 使用各种**技能**（skill），比如做 PPT、画图表、写研究报告

### 核心概念通俗解释

| 专业术语 | 通俗解释 |
|---------|---------|
| **Agent（智能体）** | 一个能自主思考、做决策、调用工具的 AI 程序。就像一个有自主行动能力的机器人员工 |
| **Lead Agent（主智能体）** | 团队里的"组长"，接收你的问题，决定怎么做，必要时把子任务分给其他 agent |
| **Sub-Agent（子智能体）** | "组员"，由主智能体派出去执行具体的子任务，比如专门执行代码、专门搜索等 |
| **Tool（工具）** | Agent 可以调用的能力，比如搜索网页（web_search）、执行命令（bash）、读文件（read_file） |
| **Middleware（中间件）** | 请求处理的"流水线"。每个中间件负责一个环节，比如设置工作目录、压缩对话历史、生成标题等。消息像流水线上的产品，依次经过每个工位 |
| **Sandbox（沙箱）** | 一个隔离的安全环境，Agent 在里面执行代码。就像给 AI 一个"虚拟电脑"，即使代码出错也不会影响真实系统 |
| **Memory（记忆）** | Agent 的长期记忆系统，能记住用户的偏好、之前聊过的内容等。就像 AI 有了一个"笔记本" |
| **Skill（技能）** | 预先写好的指令模板，告诉 Agent 如何完成某类特定任务。比如"如何做一个 PPT"的详细步骤指南 |
| **Thread（对话线程）** | 一次完整的对话，就像微信里的一个聊天窗口。每个 thread 有自己的消息历史和文件空间 |
| **Checkpointer（检查点记录器）** | 保存对话状态的组件，就像游戏的"存档"功能，断线后可以接着聊 |
| **SSE（Server-Sent Events）** | 一种服务器向浏览器实时推送数据的技术。让 AI 的回答可以"一个字一个字"地显示出来，而不是等全部生成完才显示 |
| **MCP（Model Context Protocol）** | 模型上下文协议，一种让 AI 连接外部工具（如 GitHub、数据库）的标准协议。就像给 AI 装上各种"插头"，可以接入不同的外部服务 |
| **LangChain** | 一个 Python 框架，提供了构建 AI 应用的基础组件（模型调用、工具封装、消息管理等） |
| **LangGraph** | 基于 LangChain 的框架，专门用来编排多步骤 AI 工作流，支持状态管理和流式输出 |
| **FastAPI** | 一个 Python Web 框架，用来写后端 API 接口，特点是速度快、自动生成文档 |
| **Next.js** | 一个基于 React 的前端框架，用来构建网页界面，支持服务端渲染和文件路由 |
| **React** | 一个前端 JavaScript 库，用来构建用户界面的组件 |
| **Tailwind CSS** | 一个 CSS 工具库，通过预定义的类名快速编写样式，不用自己写 CSS |
| **Docker** | 容器化工具，把应用和它的运行环境打包在一起，确保在任何机器上都能一样地运行 |
| **Nginx** | 一个 Web 服务器 / 反向代理，在这里充当"门卫"，把不同的请求转发给不同的后端服务 |

### 整体架构

DeerFlow 采用**前后端分离**的架构，一共有 4 个主要服务协同工作：

```
用户（浏览器）
     |
     v
┌─────────────────────────────────────────────┐
│           Nginx 反向代理（端口 2026）          │
│  "前台接待员"，根据网址把请求分给不同部门       │
│                                             │
│  /api/langgraph/*  → 转给 LangGraph 服务     │
│  /api/*            → 转给 Gateway 网关       │
│  /*                → 转给 Frontend 前端      │
└─────────────────────────────────────────────┘
         |                |              |
         v                v              v
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  LangGraph   │ │   Gateway    │ │   Frontend   │
│  服务(2024)  │ │  网关(8001)  │ │  前端(3000)  │
│              │ │              │ │              │
│ - AI 对话    │ │ - 模型管理   │ │ - 网页界面   │
│ - 工具调用   │ │ - 技能管理   │ │ - 聊天窗口   │
│ - 流式输出   │ │ - 文件上传   │ │ - 设置面板   │
│ - 状态存档   │ │ - MCP 配置   │ │              │
│              │ │ - 记忆管理   │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
         |                |
         v                v
┌─────────────────────────────────────────────┐
│              共享配置文件                      │
│  config.yaml          extensions_config.json │
│  (模型/工具/沙箱等)    (MCP 服务器/技能开关)  │
└─────────────────────────────────────────────┘
```

**工作流程简述**：
1. 用户在浏览器打开 `http://localhost:2026`，看到前端页面
2. 用户输入消息，前端把消息发给 Nginx
3. Nginx 识别出这是对话请求，转发给 LangGraph 服务
4. LangGraph 服务调用 AI 模型、执行工具，把结果以 SSE 流式方式返回
5. 前端实时显示 AI 的回答

### 技术栈一览

| 层级 | 技术 | 用途 |
|-----|------|------|
| **前端框架** | Next.js 16 + React 19 | 构建网页界面 |
| **前端样式** | Tailwind CSS v4 | 快速写页面样式 |
| **前端 UI 组件** | Radix UI | 可访问性优先的 UI 基础组件 |
| **前端状态管理** | TanStack React Query | 管理服务器数据的请求和缓存 |
| **前端流式通信** | LangGraph SDK (useStream) | 接收 AI 的实时流式回复 |
| **后端框架** | FastAPI | 提供 REST API 接口 |
| **AI 框架** | LangChain + LangGraph | 构建 AI Agent、编排工作流 |
| **AI 模型** | 支持 OpenAI / Gemini / Claude / DeepSeek 等 | 大语言模型提供商 |
| **包管理（Python）** | uv | 管理 Python 依赖包（类似 pip 但更快） |
| **包管理（Node）** | pnpm | 管理前端 JavaScript 依赖包 |
| **部署** | Docker + docker-compose | 容器化部署 |
| **反向代理** | Nginx | 统一入口、请求转发 |
| **数据库** | SQLite（默认）| 存储对话状态、检查点 |

---

## 第二部分：项目目录树

```
deer-flow/
├── .env                          # 环境变量（存放 API 密钥等秘密信息）
├── .env.example                  # 环境变量模板（告诉你需要填哪些密钥）
├── config.yaml                   # 核心配置文件（模型、工具、沙箱等所有设置）
├── config.example.yaml           # 配置文件模板
├── extensions_config.json        # 扩展配置（MCP 服务器和技能开关）
├── Makefile                      # 一键命令入口（make dev, make install 等）
├── README.md                     # 英文项目说明
├── README_zh.md                  # 中文项目说明
├── README_fr.md                  # 法文项目说明
├── README_ja.md                  # 日文项目说明
├── README_ru.md                  # 俄文项目说明
├── Install.md                    # 安装指南
├── CONTRIBUTING.md               # 贡献指南
├── SECURITY.md                   # 安全说明
├── LICENSE                       # MIT 开源协议
│
├── backend/                      # ===== 后端代码（Python）=====
│   ├── pyproject.toml            # Python 项目配置和依赖声明
│   ├── uv.lock                   # 依赖版本锁定文件
│   ├── ruff.toml                 # Python 代码格式化规则
│   ├── Makefile                  # 后端专用命令
│   ├── Dockerfile                # 后端 Docker 镜像构建文件
│   ├── langgraph.json            # LangGraph 服务的入口配置
│   ├── AGENTS.md                 # AI 编码助手的指导文件
│   ├── CLAUDE.md                 # Claude 编码助手的指导文件
│   │
│   ├── app/                      # --- 应用层（HTTP 接口和渠道集成）---
│   │   ├── gateway/              # FastAPI 网关
│   │   │   ├── app.py            #   应用入口，创建 FastAPI 实例
│   │   │   ├── config.py         #   网关自身的配置（主机、端口）
│   │   │   ├── deps.py           #   依赖注入，初始化运行时组件
│   │   │   ├── services.py       #   核心服务逻辑（启动运行、SSE 消费等）
│   │   │   ├── path_utils.py     #   路径工具函数
│   │   │   └── routers/          #   API 路由（每个文件负责一组接口）
│   │   │       ├── models.py     #     /api/models — 模型列表
│   │   │       ├── mcp.py        #     /api/mcp — MCP 配置管理
│   │   │       ├── memory.py     #     /api/memory — 记忆管理
│   │   │       ├── skills.py     #     /api/skills — 技能管理
│   │   │       ├── uploads.py    #     /api/threads/{id}/uploads — 文件上传
│   │   │       ├── artifacts.py  #     /api/threads/{id}/artifacts — 产出物下载
│   │   │       ├── threads.py    #     /api/threads/{id} — 对话线程管理
│   │   │       ├── thread_runs.py#     LangGraph 兼容的运行生命周期
│   │   │       ├── runs.py       #     无状态运行（不需预创建线程）
│   │   │       ├── agents.py     #     /api/agents — 自定义 Agent 管理
│   │   │       ├── suggestions.py#     /api/threads/{id}/suggestions — 后续问题建议
│   │   │       ├── channels.py   #     /api/channels — IM 渠道状态
│   │   │       └── assistants_compat.py  # LangGraph Platform 兼容层
│   │   │
│   │   └── channels/             # 即时通讯渠道集成
│   │       ├── base.py           #   渠道抽象基类
│   │       ├── feishu.py         #   飞书集成
│   │       ├── slack.py          #   Slack 集成
│   │       ├── telegram.py       #   Telegram 集成
│   │       ├── manager.py        #   渠道管理器
│   │       ├── message_bus.py    #   消息总线（收发消息的通道）
│   │       ├── service.py        #   渠道服务启停
│   │       └── store.py          #   渠道状态持久化
│   │
│   ├── packages/harness/         # --- 核心引擎库（deerflow-harness）---
│   │   ├── pyproject.toml        # 核心库的依赖声明
│   │   └── deerflow/             # deerflow 核心 Python 包
│   │       ├── client.py         #   内嵌 Python 客户端（不需要启动服务即可使用）
│   │       │
│   │       ├── agents/           #   智能体系统
│   │       │   ├── factory.py    #     Agent 工厂（创建 Agent 的快捷方式）
│   │       │   ├── features.py   #     功能特性开关
│   │       │   ├── thread_state.py#    对话状态定义
│   │       │   │
│   │       │   ├── lead_agent/   #     主智能体
│   │       │   │   ├── agent.py  #       核心入口：make_lead_agent 函数
│   │       │   │   └── prompt.py #       系统提示词模板
│   │       │   │
│   │       │   ├── checkpointer/ #     检查点（对话存档）
│   │       │   │   ├── provider.py#      同步检查点提供者
│   │       │   │   └── async_provider.py# 异步检查点提供者
│   │       │   │
│   │       │   ├── memory/       #     长期记忆系统
│   │       │   │   ├── storage.py#       记忆存储（读写 JSON 文件）
│   │       │   │   ├── updater.py#       记忆更新器（增删改查事实）
│   │       │   │   ├── prompt.py #       记忆注入提示词
│   │       │   │   └── queue.py  #       异步记忆更新队列
│   │       │   │
│   │       │   └── middlewares/  #     中间件链（请求处理流水线）
│   │       │       ├── thread_data_middleware.py     # 初始化工作目录
│   │       │       ├── uploads_middleware.py         # 处理上传文件
│   │       │       ├── sandbox_audit_middleware.py   # 沙箱命令审计
│   │       │       ├── dangling_tool_call_middleware.py # 修复缺失的工具回复
│   │       │       ├── tool_error_handling_middleware.py# 工具错误处理
│   │       │       ├── deferred_tool_filter_middleware.py# 延迟工具过滤
│   │       │       ├── clarification_middleware.py   # 用户澄清请求
│   │       │       ├── memory_middleware.py          # 记忆更新
│   │       │       ├── title_middleware.py           # 自动生成标题
│   │       │       ├── todo_middleware.py            # 任务清单
│   │       │       ├── token_usage_middleware.py     # Token 用量统计
│   │       │       ├── loop_detection_middleware.py  # 循环检测
│   │       │       ├── subagent_limit_middleware.py  # 子智能体数量限制
│   │       │       └── view_image_middleware.py      # 图片查看
│   │       │
│   │       ├── tools/            #   工具系统
│   │       │   ├── tools.py      #     工具加载入口：get_available_tools
│   │       │   └── builtins/     #     内置工具
│   │       │       ├── present_file_tool.py    # 展示文件给用户
│   │       │       ├── clarification_tool.py   # 向用户提问澄清
│   │       │       ├── task_tool.py            # 委托子智能体
│   │       │       ├── view_image_tool.py      # 查看图片
│   │       │       ├── setup_agent_tool.py     # 创建自定义 Agent
│   │       │       ├── tool_search.py          # 延迟 MCP 工具发现
│   │       │       └── invoke_acp_agent_tool.py# 调用 ACP 协议 Agent
│   │       │
│   │       ├── models/           #   AI 模型工厂
│   │       │   ├── factory.py    #     根据配置创建模型实例
│   │       │   ├── patched_openai.py    # OpenAI 兼容模型补丁
│   │       │   ├── patched_minimax.py   # MiniMax 模型补丁
│   │       │   ├── patched_deepseek.py  # DeepSeek 模型补丁
│   │       │   ├── claude_provider.py   # Claude 模型提供者
│   │       │   ├── openai_codex_provider.py # Codex 模型提供者
│   │       │   └── credential_loader.py # 凭证加载器
│   │       │
│   │       ├── mcp/              #   MCP 协议集成
│   │       │   ├── client.py     #     MCP 客户端构建
│   │       │   ├── cache.py      #     MCP 工具缓存
│   │       │   ├── tools.py      #     MCP 工具获取
│   │       │   └── oauth.py      #     MCP OAuth 认证
│   │       │
│   │       ├── sandbox/          #   沙箱系统
│   │       │   ├── sandbox.py    #     沙箱抽象基类
│   │       │   ├── sandbox_provider.py  # 沙箱提供者
│   │       │   ├── middleware.py #     沙箱中间件
│   │       │   ├── tools.py      #     沙箱工具（bash/读写文件等）
│   │       │   ├── security.py   #     安全检查
│   │       │   ├── exceptions.py #     沙箱异常定义
│   │       │   └── local/        #     本地沙箱实现
│   │       │       ├── local_sandbox.py          # 本地沙箱
│   │       │       ├── local_sandbox_provider.py  # 本地沙箱提供者
│   │       │       └── list_dir.py               # 目录列表功能
│   │       │
│   │       ├── skills/           #   技能系统
│   │       │   ├── types.py      #     Skill 数据类定义
│   │       │   ├── parser.py     #     解析 SKILL.md 文件
│   │       │   ├── loader.py     #     加载所有技能
│   │       │   ├── validation.py #     技能文件验证
│   │       │   └── installer.py  #     从 ZIP 安装技能
│   │       │
│   │       ├── runtime/          #   运行时系统
│   │       │   ├── serialization.py     # 数据序列化（转成可传输的格式）
│   │       │   ├── runs/                # 运行管理
│   │       │   │   ├── schemas.py       #   运行状态枚举
│   │       │   │   ├── manager.py       #   运行记录管理器
│   │       │   │   └── worker.py        #   后台执行 Agent 的工人
│   │       │   ├── stream_bridge/       # 流式传输桥
│   │       │   │   ├── base.py          #   流事件定义和抽象类
│   │       │   │   ├── memory.py        #   内存中的发布-订阅
│   │       │   │   └── async_provider.py#   异步流桥提供者
│   │       │   └── store/               # 状态存储
│   │       │       ├── provider.py      #   同步 Store 工厂
│   │       │       ├── async_provider.py#   异步 Store 工厂
│   │       │       └── _sqlite_utils.py #   SQLite 工具函数
│   │       │
│   │       ├── config/           #   配置系统
│   │       │   ├── app_config.py        # 核心应用配置加载
│   │       │   ├── paths.py             # 文件路径管理
│   │       │   ├── extensions_config.py # 扩展配置（MCP/技能）
│   │       │   ├── model_config.py      # 模型配置
│   │       │   ├── tool_config.py       # 工具配置
│   │       │   ├── sandbox_config.py    # 沙箱配置
│   │       │   ├── memory_config.py     # 记忆配置
│   │       │   ├── skills_config.py     # 技能配置
│   │       │   ├── summarization_config.py    # 摘要配置
│   │       │   ├── checkpointer_config.py     # 检查点配置
│   │       │   ├── title_config.py            # 标题生成配置
│   │       │   ├── token_usage_config.py      # Token 用量配置
│   │       │   ├── tracing_config.py          # 调用链追踪配置
│   │       │   ├── guardrails_config.py       # 安全护栏配置
│   │       │   ├── subagents_config.py        # 子智能体配置
│   │       │   ├── agents_config.py           # Agent 配置
│   │       │   ├── stream_bridge_config.py    # 流桥配置
│   │       │   ├── tool_search_config.py      # 工具搜索配置
│   │       │   └── acp_config.py              # ACP 协议配置
│   │       │
│   │       ├── subagents/        #   子智能体系统
│   │       │   ├── config.py     #     子智能体配置
│   │       │   ├── registry.py   #     子智能体注册表
│   │       │   ├── executor.py   #     子智能体执行器
│   │       │   └── builtins/     #     内置子智能体
│   │       │       ├── general_purpose.py  # 通用子智能体
│   │       │       └── bash_agent.py       # Bash 专用子智能体
│   │       │
│   │       ├── guardrails/       #   安全护栏
│   │       │   ├── provider.py   #     护栏提供者协议
│   │       │   ├── builtin.py    #     内置白名单护栏
│   │       │   └── middleware.py #     护栏中间件
│   │       │
│   │       ├── reflection/       #   反射系统
│   │       │   └── resolvers.py  #     动态导入类和变量
│   │       │
│   │       ├── uploads/          #   文件上传管理
│   │       │   └── manager.py    #     上传目录管理和文件操作
│   │       │
│   │       ├── utils/            #   工具函数
│   │       │   ├── network.py    #     端口分配
│   │       │   ├── file_conversion.py  # 文件格式转换（PDF/PPT → Markdown）
│   │       │   └── readability.py      # 网页文章提取
│   │       │
│   │       └── community/        #   社区集成（第三方服务）
│   │           ├── tavily/       #     Tavily 搜索
│   │           ├── firecrawl/    #     Firecrawl 网页爬取
│   │           ├── ddg_search/   #     DuckDuckGo 搜索
│   │           ├── jina_ai/      #     Jina AI 网页获取
│   │           ├── infoquest/    #     InfoQuest 搜索
│   │           ├── image_search/ #     图片搜索
│   │           └── aio_sandbox/  #     远程/Docker 沙箱
│   │
│   ├── tests/                    # --- 单元测试 ---
│   │   ├── conftest.py           #   测试配置和共享夹具
│   │   ├── test_client.py        #   客户端测试
│   │   ├── test_checkpointer.py  #   检查点测试
│   │   ├── test_memory_*.py      #   记忆系统测试
│   │   ├── test_skills_*.py      #   技能系统测试
│   │   ├── test_sandbox_*.py     #   沙箱系统测试
│   │   └── ...                   #   （约 70 个测试文件）
│   │
│   ├── docs/                     # --- 后端文档 ---
│   │   ├── ARCHITECTURE.md       #   架构总览
│   │   ├── API.md                #   API 接口文档
│   │   ├── SETUP.md              #   环境搭建指南
│   │   ├── CONFIGURATION.md      #   配置详解
│   │   ├── MCP_SERVER.md         #   MCP 服务器指南
│   │   ├── FILE_UPLOAD.md        #   文件上传指南
│   │   ├── GUARDRAILS.md         #   安全护栏文档
│   │   ├── MEMORY_IMPROVEMENTS.md#   记忆系统改进
│   │   └── ...                   #   （约 24 个文档）
│   │
│   └── .deer-flow/               # --- 运行时数据 ---
│       ├── memory.json           #   记忆数据文件
│       ├── SOUL.md               #   Agent 的"灵魂"描述
│       └── threads/              #   各对话线程的文件
│
├── frontend/                     # ===== 前端代码（TypeScript/React）=====
│   ├── package.json              # 前端依赖和脚本
│   ├── pnpm-lock.yaml            # 依赖版本锁定
│   ├── next.config.js            # Next.js 配置（API 代理等）
│   ├── tsconfig.json             # TypeScript 配置
│   ├── postcss.config.js         # PostCSS 配置（Tailwind 需要）
│   ├── eslint.config.js          # 代码规范检查配置
│   ├── components.json           # UI 组件库配置
│   ├── Dockerfile                # 前端 Docker 构建文件
│   ├── Makefile                  # 前端专用命令
│   ├── .env                      # 前端环境变量
│   │
│   ├── public/                   # 静态资源
│   │   ├── images/deer.svg       #   Logo 图片
│   │   └── demo/threads/         #   演示用的对话数据
│   │
│   └── src/                      # 源代码
│       ├── env.js                #   环境变量校验（用 Zod 确保类型正确）
│       │
│       ├── app/                  #   --- Next.js 页面路由 ---
│       │   ├── layout.tsx        #     根布局（主题、国际化）
│       │   ├── page.tsx          #     首页（营销落地页）
│       │   ├── workspace/        #     工作区
│       │   │   ├── layout.tsx    #       工作区布局（侧边栏、查询客户端）
│       │   │   ├── page.tsx      #       工作区入口（重定向到聊天）
│       │   │   ├── chats/        #       聊天页面
│       │   │   │   ├── page.tsx  #         聊天列表
│       │   │   │   └── [thread_id]/      # 具体对话页面
│       │   │   │       ├── layout.tsx     #   对话布局
│       │   │   │       └── page.tsx       #   对话主页面
│       │   │   └── agents/       #       Agent 管理页面
│       │   │       ├── page.tsx  #         Agent 画廊
│       │   │       ├── new/      #         创建新 Agent
│       │   │       └── [agent_name]/     # 特定 Agent 的对话
│       │   ├── api/              #     后端 API 路由
│       │   │   ├── auth/         #       认证相关
│       │   │   └── memory/       #       记忆 API 代理
│       │   └── mock/api/         #     模拟 API（用于演示模式）
│       │
│       ├── core/                 #   --- 核心业务逻辑 ---
│       │   ├── api/              #     API 客户端封装
│       │   ├── threads/          #     对话线程（hooks、类型、工具函数）
│       │   ├── agents/           #     Agent 管理
│       │   ├── settings/         #     用户设置（localStorage 持久化）
│       │   ├── i18n/             #     国际化（中英双语）
│       │   ├── config/           #     前端配置
│       │   ├── tasks/            #     子任务状态管理
│       │   ├── artifacts/        #     产出物管理
│       │   ├── uploads/          #     文件上传
│       │   ├── mcp/              #     MCP 配置管理
│       │   ├── models/           #     模型信息
│       │   ├── skills/           #     技能管理
│       │   ├── memory/           #     记忆管理
│       │   ├── notification/     #     浏览器通知
│       │   ├── todos/            #     任务清单
│       │   ├── messages/         #     消息处理
│       │   ├── streamdown/       #     流式 Markdown 渲染
│       │   └── rehype/           #     Markdown 后处理插件
│       │
│       ├── components/           #   --- UI 组件 ---
│       │   ├── workspace/        #     工作区组件
│       │   │   ├── workspace-sidebar.tsx      # 侧边栏
│       │   │   ├── workspace-header.tsx       # 顶部栏
│       │   │   ├── input-box.tsx              # 输入框
│       │   │   ├── chats/                     # 聊天相关组件
│       │   │   │   ├── use-thread-chat.ts     #   聊天 Hook
│       │   │   │   └── use-chat-mode.ts       #   聊天模式
│       │   │   ├── messages/                  # 消息渲染组件
│       │   │   ├── settings/                  # 设置面板
│       │   │   ├── artifacts/                 # 产出物展示
│       │   │   └── agents/                    # Agent 管理组件
│       │   ├── landing/          #     落地页组件（Hero、页脚等）
│       │   ├── ai-elements/      #     AI 元素组件（提示输入、代码块等）
│       │   ├── ui/               #     基础 UI 原子组件（按钮、对话框等）
│       │   └── theme-provider.tsx#     主题提供者（亮/暗主题）
│       │
│       ├── hooks/                #   自定义 React Hooks
│       │   ├── use-global-shortcuts.ts  # 全局快捷键
│       │   └── use-mobile.ts            # 移动端检测
│       │
│       ├── lib/                  #   工具函数
│       │   ├── utils.ts          #     通用工具（className 合并等）
│       │   └── ime.ts            #     输入法相关
│       │
│       ├── server/better-auth/   #   认证系统
│       │   ├── server.ts         #     认证服务端
│       │   ├── client.ts         #     认证客户端
│       │   └── config.ts         #     认证配置
│       │
│       ├── styles/globals.css    #   全局样式
│       └── typings/md.d.ts       #   TypeScript 类型声明
│
├── docker/                       # ===== Docker 部署配置 =====
│   ├── docker-compose.yaml       # 生产环境编排
│   ├── docker-compose-dev.yaml   # 开发环境编排
│   ├── nginx/                    # Nginx 配置
│   │   ├── nginx.conf            #   生产环境 Nginx 配置
│   │   └── nginx.local.conf      #   本地开发 Nginx 配置
│   └── provisioner/              # Kubernetes 沙箱供应器
│       ├── Dockerfile            #   供应器镜像
│       ├── app.py                #   供应器 API
│       └── README.md             #   供应器说明
│
├── scripts/                      # ===== 辅助脚本 =====
│   ├── configure.py              # 生成初始配置
│   ├── config-upgrade.sh         # 配置版本升级
│   ├── check.py / check.sh       # 环境检查
│   ├── serve.sh                  # 启动本地服务
│   ├── start-daemon.sh           # 后台启动
│   ├── deploy.sh                 # 生产部署
│   ├── docker.sh                 # Docker 开发环境管理
│   ├── cleanup-containers.sh     # 清理沙箱容器
│   ├── wait-for-port.sh          # 等待端口就绪
│   └── ...                       # 其他辅助脚本
│
├── skills/                       # ===== 内置技能 =====
│   └── public/                   # 公开技能
│       ├── deep-research/        #   深度研究
│       ├── chart-visualization/  #   图表可视化
│       ├── ppt-generation/       #   PPT 生成
│       ├── podcast-generation/   #   播客生成
│       ├── video-generation/     #   视频生成
│       ├── image-generation/     #   图片生成
│       ├── data-analysis/        #   数据分析
│       ├── web-design-guidelines/#   网页设计指南
│       ├── frontend-design/      #   前端设计
│       ├── consulting-analysis/  #   咨询分析
│       ├── github-deep-research/ #   GitHub 深度研究
│       ├── skill-creator/        #   技能创建器
│       ├── find-skills/          #   技能搜索
│       ├── surprise-me/          #   惊喜功能
│       ├── bootstrap/            #   初始化引导
│       ├── claude-to-deerflow/   #   Claude 到 DeerFlow 迁移
│       └── vercel-deploy-claimable/ # Vercel 部署
│
├── docs/                         # ===== 根目录文档 =====
│   ├── CODE_CHANGE_SUMMARY_BY_FILE.md  # 代码变更摘要
│   └── SKILL_NAME_CONFLICT_FIX.md      # 技能名冲突修复
│
├── logs/                         # ===== 日志文件 =====
│   ├── frontend.log              # 前端日志
│   ├── gateway.log               # 网关日志
│   └── langgraph.log             # LangGraph 日志
│
└── .github/                      # ===== GitHub 配置 =====
    ├── workflows/                # CI/CD 工作流
    │   ├── backend-unit-tests.yml#   后端单元测试
    │   └── lint-check.yml        #   代码规范检查
    └── ISSUE_TEMPLATE/           # Issue 模板
```

---

## 第三部分：根目录文件讲解

### config.yaml — 核心配置文件

这是整个项目最重要的配置文件，控制着 DeerFlow 的所有行为。

**通俗理解**：就像一个餐厅的"总管理手册"，规定了厨师用什么食材（模型）、有哪些工具（菜刀、烤箱）、厨房的安全规则（沙箱）等。

**主要配置项**：

| 配置区域 | 作用 | 通俗解释 |
|---------|------|---------|
| `config_version: 4` | 配置版本号 | 标记当前配置格式的版本，升级时用来判断是否需要迁移 |
| `log_level: info` | 日志级别 | 控制程序运行时打印多少调试信息，`info` 是适中的级别 |
| `token_usage` | Token 用量追踪 | 是否统计每次 AI 对话消耗了多少"字数额度" |
| `models` | 模型配置列表 | 配置可用的 AI 模型，包括用哪家公司的模型、API 密钥、超时时间等 |
| `tools` | 工具配置 | 定义 Agent 可以使用哪些工具，如搜索、执行代码、读写文件 |
| `tool_search` | 工具搜索 | 是否启用延迟加载 MCP 工具（按需加载，不一次全部加载） |
| `sandbox` | 沙箱配置 | AI 执行代码的安全环境设置 |
| `skills` | 技能配置 | 技能文件存放的路径 |
| `title` | 标题生成 | 是否自动为对话生成标题 |
| `summarization` | 对话摘要 | 对话太长时是否自动压缩旧消息 |
| `memory` | 记忆配置 | 长期记忆的存储路径、更新频率、事实数量上限等 |
| `checkpointer` | 检查点配置 | 对话状态的存储方式（SQLite/Postgres/内存） |

**模型配置示例讲解**：
```yaml
models:
  - name: gemini-2.5-flash-lite          # 模型的内部名字
    display_name: Gemini 2.5 Flash Lite  # 在界面上显示的名字
    use: langchain_google_genai:ChatGoogleGenerativeAI  # 用哪个 Python 类来调用
    model: gemini-2.5-flash-lite         # 模型在 API 中的 ID
    google_api_key: $GEMINI_API_KEY      # API 密钥（从环境变量读取）
    timeout: 600.0                       # 超时时间（秒）
    max_retries: 2                       # 失败后最多重试几次
    max_tokens: 8192                     # 最多生成多少个 token（约等于字数）
    supports_vision: true                # 是否支持"看图"能力
```

`use` 字段的格式是 `包名:类名`，DeerFlow 会在运行时通过**反射**（动态导入）机制把这个字符串变成一个真实的 Python 类。

### .env / .env.example — 环境变量文件

`.env.example` 是模板，`.env` 是你填好 API 密钥后的实际文件。

**通俗理解**：`.env` 就像一个保险箱，把敏感信息（API 密钥、密码）放在这里，代码里只写"去保险箱里取 GEMINI_API_KEY"，而不是把密码直接写在代码里。

**常见环境变量**：
```
GEMINI_API_KEY=你的Gemini密钥
TAVILY_API_KEY=你的Tavily搜索密钥
JINA_API_KEY=你的Jina密钥
```

### Makefile — 一键命令入口

Makefile 把各种复杂的命令封装成简单的短命令。

| 命令 | 作用 |
|------|------|
| `make config` | 生成初始配置文件 |
| `make install` | 安装所有依赖 |
| `make dev` | 启动本地开发环境 |
| `make docker-init` | 初始化 Docker 环境 |
| `make up` | 用 Docker 启动生产环境 |
| `make down` | 停止 Docker 服务 |
| `make check` | 检查系统环境是否满足要求 |

### extensions_config.json — 扩展配置

管理 MCP 服务器连接和技能的启用/禁用状态。

**通俗理解**：这个文件决定了 AI 可以连接哪些"外部插件"。比如你想让 AI 操作 GitHub，就在这里配置 GitHub 的 MCP 服务器信息。

```json
{
  "mcpServers": {
    "github": {
      "enabled": true,
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "$GITHUB_TOKEN" }
    }
  },
  "skills": {
    "deep-research": { "enabled": true }
  }
}
```

---

## 第四部分：backend/ 后端讲解

后端分为两大部分：
1. **app/**：HTTP 接口层（FastAPI 网关 + IM 渠道）
2. **packages/harness/deerflow/**：核心引擎库（Agent、工具、沙箱等）

### app/gateway/ — API 网关

网关是后端对外提供 HTTP 接口的入口。

#### app.py — 应用入口

**重要函数**：

- **`create_app()`**：创建并配置整个 FastAPI 应用
  - 注册所有路由（models、mcp、memory、skills 等）
  - 设置 `/health` 健康检查接口
  - 通俗理解：就像开一家公司，在这里设立各个"部门"，并把对应的工作分配给它们

- **`lifespan(app)`**：应用的"生命周期管理器"
  - 启动时：加载配置 → 初始化 LangGraph 运行时（流桥、运行管理器、检查点、存储）→ 启动 IM 渠道
  - 关闭时：停止 IM 渠道 → 清理资源
  - 通俗理解：就像公司的"开业流程"和"关店流程"

```python
# 启动时的流程
async with langgraph_runtime(app):   # 1. 启动"AI 大脑"的运行环境
    channel_service = await start_channel_service()  # 2. 开启飞书/Slack/Telegram 等渠道
    yield                            # 3. 应用运行中...
    await stop_channel_service()     # 4. 关闭时清理渠道
```

#### deps.py — 依赖注入

**重要函数**：

- **`langgraph_runtime(app)`**：初始化所有运行时组件
  - 创建 StreamBridge（流桥，用于实时传输 AI 回复）
  - 创建 RunManager（运行管理器，追踪所有正在进行的对话）
  - 创建 Checkpointer（检查点，保存对话状态）
  - 创建 Store（存储，保存线程元数据）
  - 通俗理解：就像设置好餐厅的厨房设备——灶台（模型）、传菜窗口（流桥）、订单系统（运行管理器）、菜谱档案柜（检查点）

#### services.py — 核心服务逻辑

**重要函数**：

- **`start_run(...)`**：启动一次 Agent 运行
  - 创建 RunRecord（运行记录）
  - 启动后台任务执行 Agent
  - 返回运行 ID
  - 通俗理解：顾客下单后，给厨房发一张新的订单

- **`sse_consumer(...)`**：SSE 事件消费者
  - 从流桥中读取 Agent 产生的事件
  - 转换成 SSE 格式发送给浏览器
  - 通俗理解：传菜员从厨房窗口取菜，端给顾客

- **`format_sse(event, data)`**：把数据格式化成 SSE 文本
  - 通俗理解：给每道菜贴上标签，写清楚是什么菜

#### routers/ — API 路由

每个路由文件负责一组相关的 API 接口：

| 文件 | 路径前缀 | 功能 | 重要接口 |
|------|---------|------|---------|
| **models.py** | `/api/models` | 模型管理 | `GET /` 获取所有可用模型列表 |
| **mcp.py** | `/api/mcp` | MCP 配置 | `GET /config` 获取配置，`PUT /config` 更新配置 |
| **memory.py** | `/api/memory` | 记忆管理 | `GET /` 获取记忆，`POST /facts` 创建事实，`DELETE /facts/{id}` 删除事实 |
| **skills.py** | `/api/skills` | 技能管理 | `GET /` 列出技能，`PATCH /{name}` 更新技能状态，`POST /install` 安装技能 |
| **uploads.py** | `/api/threads/{id}/uploads` | 文件上传 | `POST /` 上传文件，`GET /` 列出文件，`DELETE /{filename}` 删除文件 |
| **artifacts.py** | `/api/threads/{id}/artifacts` | 产出物 | `GET /{path}` 下载 Agent 生成的文件 |
| **threads.py** | `/api/threads/{id}` | 线程管理 | `DELETE /` 清理线程文件 |
| **thread_runs.py** | `/api/threads/{id}/runs` | 运行管理 | `POST /` 创建运行，`GET /{run_id}/stream` 获取流式输出 |
| **runs.py** | `/api/runs` | 无状态运行 | 不需要预先创建线程，直接发消息 |
| **agents.py** | `/api/agents` | Agent 管理 | `POST /` 创建自定义 Agent，`GET /` 列出所有 Agent |
| **suggestions.py** | `/api/threads/{id}/suggestions` | 问题建议 | `GET /` 获取 AI 推荐的后续问题 |
| **channels.py** | `/api/channels` | IM 渠道 | `GET /status` 查看渠道状态 |

### app/channels/ — 即时通讯渠道

除了网页聊天，DeerFlow 还能接入飞书、Slack、Telegram 等即时通讯软件。

| 文件 | 功能 |
|------|------|
| **base.py** | 定义渠道的抽象基类 `Channel`，所有渠道都必须实现的方法 |
| **feishu.py** | 飞书集成：接收飞书消息、发送回复、处理飞书事件 |
| **slack.py** | Slack 集成：同上 |
| **telegram.py** | Telegram 集成：同上 |
| **manager.py** | `ChannelManager` — 渠道管理器，负责接收消息 → 调用 Agent → 发送回复。就像一个"翻译官"，把各种 IM 的消息翻译成 Agent 能理解的格式 |
| **message_bus.py** | `MessageBus` — 消息总线，定义了 `InboundMessage`（进来的消息）和 `OutboundMessage`（发出去的消息）的格式 |
| **service.py** | `ChannelService` — 渠道服务的启动和停止 |
| **store.py** | `ChannelStore` — 保存渠道的运行状态 |

### packages/harness/deerflow/ — 核心引擎

这是整个项目最核心的部分，是 Agent 的"大脑"和"四肢"。

#### client.py — 内嵌 Python 客户端

**通俗理解**：你不需要启动整个 Web 服务，直接在 Python 代码里就能和 AI 对话。

**重要类：`DeerFlowClient`**

```python
from deerflow.client import DeerFlowClient

client = DeerFlowClient()
# 简单对话
response = client.chat("你好，帮我分析一下这篇论文")
# 流式对话
for event in client.stream("你好"):
    print(event.type, event.data)
```

**关键方法**：

| 方法 | 作用 |
|------|------|
| `chat(message)` | 发送消息，返回 AI 的完整回复文本 |
| `stream(message)` | 发送消息，逐步返回事件（可以看到 AI 一个字一个字地输出） |
| `list_models()` | 列出所有可用的 AI 模型 |
| `list_skills()` | 列出所有技能 |
| `get_memory()` | 获取 AI 的长期记忆 |
| `upload_files(thread_id, files)` | 上传文件到对话 |
| `get_mcp_config()` | 获取 MCP 服务器配置 |
| `reset_agent()` | 强制重新创建 Agent（配置变更后使用） |

**内部工作原理**：

1. `_ensure_agent(config)`：第一次调用时创建 Agent，之后如果配置没变就复用。这叫**懒加载**（Lazy Loading），只在真正需要时才创建，节省资源
2. `_get_runnable_config(thread_id)`：构建 Agent 运行时需要的配置参数
3. `_serialize_message(msg)`：把 LangChain 的消息对象转成普通的字典，方便传输
4. `_extract_text(content)`：从 AI 的回复中提取纯文本内容

**`StreamEvent` 数据类**：

流式输出时，每个事件都是一个 `StreamEvent` 对象：
- `type="messages-tuple"`：AI 正在输出内容（文字或工具调用）
- `type="values"`：完整的状态快照（标题、所有消息、产出物列表）
- `type="end"`：对话结束，包含 Token 用量统计

---

#### agents/ — 智能体系统

这是整个 DeerFlow 的核心中的核心。

##### agents/lead_agent/agent.py — 主智能体入口

**核心函数：`make_lead_agent(config)`**

这个函数是整个 AI 系统的"总装配车间"，负责把所有零件组装成一个完整的 Agent。

**组装过程**：

```
make_lead_agent(config)
    │
    ├── 1. 确定用哪个模型 → _resolve_model_name()
    │      如果用户指定了模型就用指定的，否则用默认的
    │
    ├── 2. 创建 AI 模型实例 → create_chat_model()
    │      根据 config.yaml 里的 `use` 字段，动态创建对应的模型对象
    │
    ├── 3. 加载可用工具 → get_available_tools()
    │      从配置文件 + 内置工具 + MCP 工具中收集所有可用的工具
    │
    ├── 4. 构建中间件链 → _build_middlewares()
    │      创建一系列"处理环节"，每个负责一个功能
    │
    ├── 5. 生成系统提示词 → apply_prompt_template()
    │      告诉 AI "你是谁、你能做什么、要注意什么"
    │
    └── 6. 组装并返回 → create_agent()
           把模型、工具、中间件、提示词组装成一个完整的 Agent
```

**重要辅助函数**：

- **`_resolve_model_name(requested_model_name)`**：模型名称解析
  - 如果请求指定了模型且存在 → 用请求指定的
  - 如果请求指定的模型不存在 → 回退到默认模型，并打印警告
  - 如果没有任何模型配置 → 抛出错误
  - 通俗理解：点菜时你要了一道特定的菜，如果菜单上有就做；如果没有就给你推荐厨师的拿手菜

- **`_create_summarization_middleware()`**：创建对话摘要中间件
  - 当对话太长（超过 token 限制）时，自动把旧消息压缩成摘要
  - 通俗理解：笔记本写满了，把前面的内容概括成几句话，腾出空间继续写

- **`_create_todo_list_middleware(is_plan_mode)`**：创建任务清单中间件
  - 在"计划模式"下，AI 可以创建和管理一个待办事项列表
  - 通俗理解：给 AI 一个"任务看板"，让它像项目经理一样分解任务

- **`_build_middlewares(config, model_name)`**：构建完整的中间件链
  - 按固定顺序排列中间件，每个中间件负责一个功能
  - 通俗理解：工厂流水线上的各个工位，产品按顺序经过每个工位

**中间件的执行顺序和作用**：

```
用户消息进入
    │
    ├── 1. ThreadDataMiddleware     → 设置工作目录（每个对话有自己的文件夹）
    ├── 2. UploadsMiddleware        → 把用户上传的文件信息告诉 AI
    ├── 3. SandboxAuditMiddleware   → 记录沙箱里执行了什么命令
    ├── 4. DanglingToolCallMiddleware → 修复上一轮遗留的"无回复工具调用"
    ├── 5. ToolErrorHandlingMiddleware → 如果工具出错，优雅地处理错误
    ├── 6. SummarizationMiddleware  → 对话太长时自动压缩
    ├── 7. TodoMiddleware           → 任务清单管理（计划模式）
    ├── 8. TokenUsageMiddleware     → 统计 Token 消耗
    ├── 9. TitleMiddleware          → 自动给对话起标题
    ├── 10. MemoryMiddleware        → 把对话内容存入长期记忆
    ├── 11. ViewImageMiddleware     → 处理图片查看（视觉模型）
    ├── 12. DeferredToolFilterMiddleware → 过滤延迟加载的工具
    ├── 13. SubagentLimitMiddleware → 限制同时运行的子智能体数量
    ├── 14. LoopDetectionMiddleware → 检测 AI 是否陷入重复循环
    └── 15. ClarificationMiddleware → 处理 AI 向用户提问（永远最后执行）
    │
    v
  AI 模型处理并回复
```

##### agents/lead_agent/prompt.py — 系统提示词

**重要函数：`apply_prompt_template(...)`**

这个函数生成 Agent 的"身份说明书"，告诉 AI：
- 你是谁
- 你有哪些工具可以使用
- 你有哪些技能
- 你的记忆里记住了用户的哪些信息
- 你需要遵守哪些规则

通俗理解：就像新员工入职时收到的"岗位手册"。

##### agents/thread_state.py — 对话状态

**重要类：`ThreadState`**

```python
class ThreadState(AgentState):
    messages: list[BaseMessage]   # 消息列表（所有聊天记录）
    sandbox: dict                 # 沙箱环境信息
    artifacts: list[str]          # 产出物（AI 生成的文件路径列表）
    thread_data: dict             # 工作目录路径（workspace/uploads/outputs）
    title: str | None             # 对话标题
    todos: list[dict]             # 任务清单
    viewed_images: dict           # 已查看的图片数据
```

通俗理解：这是一个对话的"档案袋"，里面记录了这次对话的所有信息——聊了什么、生成了什么文件、标题是什么、有没有待办事项。

##### agents/factory.py — Agent 工厂

**重要函数：`create_deerflow_agent()`**

一个简化版的 Agent 创建函数，提供了 `RuntimeFeatures` 功能开关：

```python
class RuntimeFeatures:
    sandbox: bool      # 是否启用沙箱
    memory: bool       # 是否启用记忆
    summarization: bool # 是否启用摘要
    subagent: bool     # 是否启用子智能体
    vision: bool       # 是否启用视觉（看图）
    auto_title: bool   # 是否自动生成标题
    guardrail: bool    # 是否启用安全护栏
```

通俗理解：就像点外卖时的"加辣/不加辣/加蛋"选项，你可以灵活选择 Agent 需要哪些功能。

##### agents/checkpointer/ — 检查点系统

检查点就是对话的"存档"功能。

- **`provider.py`**：同步检查点管理
  - `get_checkpointer()`：获取检查点实例
  - `make_checkpointer()`：根据配置创建 SQLite 或 Postgres 检查点
  - `reset_checkpointer()`：重置检查点

- **`async_provider.py`**：异步版本，网关启动时使用

通俗理解：就像玩游戏时的"自动存档"，每轮对话后保存进度，即使服务重启也能继续之前的对话。

##### agents/memory/ — 长期记忆系统

| 文件 | 功能 | 重要函数/类 |
|------|------|------------|
| **storage.py** | 记忆的读写操作 | `MemoryStorage`（抽象类）、`FileMemoryStorage`（文件存储，读写 JSON 文件）、`get_memory_storage()` |
| **updater.py** | 记忆的增删改查 | `MemoryUpdater` — 核心更新器，`update_memory_from_conversation()` 从对话中提取记忆，`create_memory_fact()` 手动添加事实 |
| **prompt.py** | 把记忆注入提示词 | `format_memory_for_injection()` 格式化记忆文本，`format_conversation_for_update()` 格式化对话用于提取事实 |
| **queue.py** | 异步记忆更新队列 | `MemoryUpdateQueue` — 对话结束后不立即更新记忆，而是放入队列延迟处理，避免影响响应速度 |

**记忆的工作流程**：
```
用户和 AI 对话
    │
    ├── 1. MemoryMiddleware 捕获对话内容
    ├── 2. 放入 MemoryUpdateQueue（延迟队列）
    ├── 3. 等待防抖时间（debounce，避免频繁更新）
    ├── 4. 调用 AI 从对话中提取"事实"
    │      比如："用户喜欢 Python"、"用户是前端开发者"
    ├── 5. 存入 memory.json 文件
    └── 6. 下次对话时，记忆被注入到系统提示词中
           AI 就能记住用户的偏好
```

**通俗理解**：AI 有一个"笔记本"，每次聊完天后会回顾对话，把重要信息（用户偏好、工作背景等）记在笔记本上。下次聊天时先翻翻笔记本，这样就能记住之前聊过的内容。

##### agents/middlewares/ — 中间件链详解

每个中间件文件都是流水线上的一个"工位"：

| 中间件 | 通俗解释 |
|--------|---------|
| **ThreadDataMiddleware** | "前台登记"——给每次对话分配工作目录（workspace、uploads、outputs 三个文件夹） |
| **UploadsMiddleware** | "资料分发"——把用户上传的文件清单告诉 AI，AI 就知道有哪些文件可以使用 |
| **SandboxAuditMiddleware** | "安全监控"——记录 AI 在沙箱里执行了什么命令，用于审计 |
| **DanglingToolCallMiddleware** | "遗留问题清理"——有时 AI 调用了工具但没有收到回复（比如服务中断），这个中间件会修复这种情况 |
| **ToolErrorHandlingMiddleware** | "异常处理"——工具执行出错时，把错误信息优雅地包装成工具回复，而不是让程序崩溃 |
| **SummarizationMiddleware** | "压缩笔记"——对话太长时（超过 token 上限），自动把旧消息压缩成摘要，保留最近的消息 |
| **TitleMiddleware** | "起名官"——第一轮对话结束后，自动用 AI 给这次对话起一个简短的标题 |
| **MemoryMiddleware** | "笔记员"——把对话内容送去记忆系统，提取并保存用户偏好等信息 |
| **TodoMiddleware** | "任务看板"——在计划模式下，管理待办事项列表 |
| **TokenUsageMiddleware** | "记账员"——统计这次对话消耗了多少 Token |
| **ViewImageMiddleware** | "看图官"——当模型支持视觉能力时，把图片数据注入到消息中让 AI 能"看"到图片 |
| **LoopDetectionMiddleware** | "哨兵"——检测 AI 是否陷入无限循环（比如反复调用同一个工具），如果检测到就中断 |
| **SubagentLimitMiddleware** | "调度员"——限制同时运行的子智能体数量，防止资源耗尽 |
| **ClarificationMiddleware** | "确认员"——处理 AI 向用户提问的场景（"你是想要 A 还是 B？"）。永远排在最后 |
| **DeferredToolFilterMiddleware** | "门卫"——当启用工具搜索时，隐藏那些还没有被需要的 MCP 工具 |

---

#### tools/ — 工具系统

Agent 的"工具箱"，定义了 AI 可以使用的所有能力。

##### tools/tools.py — 工具加载入口

**核心函数：`get_available_tools(model_name, groups, subagent_enabled)`**

这个函数负责收集所有可用的工具，来源有三个：

```
工具来源：
    │
    ├── 1. 配置工具（config.yaml 中定义的）
    │      web_search → DuckDuckGo 搜索
    │      web_fetch  → Jina 网页获取
    │      image_search → DuckDuckGo 图片搜索
    │      bash       → 命令行执行
    │      read_file  → 读取文件
    │      write_file → 写入文件
    │      str_replace → 替换文件内容
    │      ls         → 列出目录内容
    │
    ├── 2. 内置工具（代码里写死的）
    │      present_file → 把文件展示给用户
    │      ask_clarification → 向用户提问
    │      task → 委派子智能体（如果启用）
    │      view_image → 查看图片（如果模型支持视觉）
    │      tool_search → 搜索 MCP 工具（如果启用）
    │
    └── 3. MCP 工具（通过 MCP 协议连接的外部工具）
           github → 操作 GitHub
           filesystem → 操作文件系统
           postgres → 操作数据库
           等等...
```

**`resolve_variable` 的工作原理**：

配置文件中的工具用字符串表示，比如 `deerflow.community.ddg_search:web_search_tool`。这个函数会：
1. 解析字符串，拆成"包路径"和"变量名"
2. 动态导入对应的 Python 模块
3. 从模块中取出对应的工具对象

通俗理解：就像根据地址找人——"XXX小区.3栋.502:张三"，先找到小区、再找到楼栋和房间，最后找到人。

##### tools/builtins/ — 内置工具详解

| 工具 | 函数 | AI 调用时的效果 |
|------|------|---------------|
| **present_file_tool.py** | `present_file` | 把文件路径展示给用户，自动处理虚拟路径 → 真实路径的映射 |
| **clarification_tool.py** | `ask_clarification_tool` | AI 觉得信息不够时，向用户提出具体问题 |
| **task_tool.py** | `task_tool` | 把子任务委派给子智能体执行。比如主 Agent 说"帮我执行这段代码"，子智能体就去沙箱里运行 |
| **view_image_tool.py** | `view_image` | 把图片内容加载到 Agent 的状态中，让视觉模型能"看到"图片 |
| **setup_agent_tool.py** | `setup_agent` | 引导用户创建自定义 Agent（设定名称、系统提示词等） |
| **tool_search.py** | `tool_search` | 延迟 MCP 工具发现——不一次加载所有 MCP 工具，而是需要时再搜索。包含 `DeferredToolRegistry`（延迟工具注册表） |
| **invoke_acp_agent_tool.py** | `build_invoke_acp_agent_tool` | 通过 ACP（Agent Communication Protocol）协议调用外部的 Agent |

---

#### models/ — AI 模型工厂

##### factory.py — 模型创建

**核心函数：`create_chat_model(name, thinking_enabled, reasoning_effort)`**

这个函数根据 `config.yaml` 中的模型配置，创建对应的 AI 模型实例。

**工作流程**：

```
create_chat_model("gemini-2.5-flash-lite")
    │
    ├── 1. 从配置中找到模型定义
    │      use: langchain_google_genai:ChatGoogleGenerativeAI
    │
    ├── 2. resolve_class() 动态导入这个类
    │      从 langchain_google_genai 包中导入 ChatGoogleGenerativeAI 类
    │
    ├── 3. 处理特殊参数
    │      如果 thinking_enabled=True 且模型支持 → 启用"深度思考"模式
    │      如果有 reasoning_effort → 设置思考强度
    │
    └── 4. 用配置参数实例化模型对象并返回
           ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", api_key="...", ...)
```

通俗理解：这就像一个"厨师调度中心"，你说"我要一个擅长写代码的厨师"，它就根据配置文件找到合适的厨师并安排上岗。

##### 各种模型补丁文件

不同 AI 厂商的 API 有些细微差异，这些文件做了适配：

| 文件 | 作用 |
|------|------|
| **patched_openai.py** | 修复 OpenAI 兼容模型的工具调用格式差异 |
| **patched_minimax.py** | 适配 MiniMax 模型的特殊行为 |
| **patched_deepseek.py** | 适配 DeepSeek 模型的推理功能 |
| **claude_provider.py** | `ClaudeChatModel` — 专门处理 Anthropic Claude 模型的特殊需求（OAuth 认证、计费等） |
| **openai_codex_provider.py** | `CodexChatModel` — 适配 OpenAI Codex Responses API |
| **credential_loader.py** | 从文件系统和环境变量中加载 AI 模型的认证凭证 |

---

#### mcp/ — MCP 协议集成

MCP（Model Context Protocol）是一种让 AI 连接外部工具和服务的标准协议。

| 文件 | 功能 | 重要函数/类 |
|------|------|------------|
| **client.py** | 构建 MCP 客户端 | `build_server_params()` 根据配置构建连接参数，`build_servers_config()` 构建多服务器配置 |
| **cache.py** | MCP 工具缓存 | `initialize_mcp_tools()` 首次加载工具，`get_cached_mcp_tools()` 获取缓存的工具（通过文件修改时间判断是否需要刷新） |
| **tools.py** | MCP 工具获取 | `get_mcp_tools()` 异步获取 MCP 工具列表 |
| **oauth.py** | OAuth 认证 | `OAuthTokenManager` 管理 MCP 服务器的 OAuth token |

**MCP 的工作原理**：

```
extensions_config.json 配置了 MCP 服务器
    │
    ├── build_servers_config() 解析配置
    │
    ├── 创建 MultiServerMCPClient
    │      同时连接多个 MCP 服务器
    │
    ├── 通过三种方式之一通信：
    │   ├── stdio（标准输入输出）— 启动一个子进程
    │   ├── SSE（服务器推送事件）— 连接远程 HTTP 服务
    │   └── HTTP — 直接 HTTP 调用
    │
    └── 获取工具列表 → 交给 Agent 使用
```

通俗理解：MCP 就像"万能适配器"。你家里有各种品牌的电器（GitHub、数据库、文件系统），MCP 就是那个"万能插座"，让 AI 都能接上使用。

---

#### sandbox/ — 沙箱系统

沙箱是 AI 执行代码的安全隔离环境。

| 文件 | 功能 |
|------|------|
| **sandbox.py** | 抽象基类 `Sandbox`，定义了沙箱必须实现的方法：`execute_command()`、`read_file()`、`write_file()`、`list_dir()` |
| **sandbox_provider.py** | `SandboxProvider` — 沙箱提供者，负责创建/获取/释放沙箱实例 |
| **middleware.py** | `SandboxMiddleware` — 确保每次工具调用前都有可用的沙箱 |
| **tools.py** | 沙箱工具定义，包含 `bash_tool`、`read_file_tool`、`write_file_tool`、`str_replace_tool`、`ls_tool`，以及虚拟路径 → 真实路径的映射 |
| **security.py** | 安全检查：`is_host_bash_allowed()` 判断是否允许在宿主机上执行命令 |

**两种沙箱模式**：

```
沙箱系统
    │
    ├── LocalSandboxProvider（本地沙箱）
    │   直接在你的电脑上执行命令
    │   简单但不够安全，适合开发调试
    │   代码在 sandbox/local/ 目录
    │
    └── AioSandboxProvider（远程/Docker 沙箱）
        在 Docker 容器中执行命令
        完全隔离，更安全，适合生产环境
        代码在 community/aio_sandbox/ 目录
```

**虚拟路径映射**：

Agent 看到的是"虚拟路径"，沙箱会自动映射到真实路径：

| 虚拟路径 | 真实路径 |
|---------|---------|
| `/mnt/user-data/workspace` | `.deer-flow/threads/{thread_id}/user-data/workspace` |
| `/mnt/user-data/uploads` | `.deer-flow/threads/{thread_id}/user-data/uploads` |
| `/mnt/user-data/outputs` | `.deer-flow/threads/{thread_id}/user-data/outputs` |
| `/mnt/skills` | `skills/` |

通俗理解：AI 以为自己在一个完全独立的电脑上操作（虚拟路径），但实际上所有文件都安全地存放在项目的特定文件夹里。

---

#### skills/ — 技能系统

技能是预写好的指令模板，让 AI 知道"如何做某类事情"。

| 文件 | 功能 |
|------|------|
| **types.py** | `Skill` 数据类：`name`（名称）、`description`（描述）、`license`（许可证）、`category`（分类）、`enabled`（是否启用）、`content`（指令内容） |
| **parser.py** | `parse_skill_file()` — 解析 SKILL.md 文件，提取 YAML frontmatter（头部元数据）和 Markdown 正文 |
| **loader.py** | `load_skills()` — 从磁盘加载所有技能，结合 `extensions_config.json` 中的启用状态 |
| **validation.py** | 验证技能文件格式是否正确 |
| **installer.py** | `install_skill_from_archive()` — 从 ZIP 压缩包安装新技能 |

**SKILL.md 文件格式**：

```markdown
---
name: 深度研究
description: 进行深度学术研究和分析
license: MIT
allowed-tools:
  - web_search
  - read_file
  - write_file
  - bash
---

# 技能指令

当用户要求你进行深度研究时，请按以下步骤：
1. 先搜索相关资料...
2. 整理信息...
3. 写出研究报告...
```

技能被启用后，`allowed-tools` 之下的指令内容会被注入到 Agent 的系统提示词中，AI 就"学会"了这个技能。

---

#### runtime/ — 运行时系统

负责 Agent 的运行管理、数据传输和状态存储。

##### runtime/runs/ — 运行管理

| 文件 | 重要类/函数 | 作用 |
|------|------------|------|
| **schemas.py** | `RunStatus` 枚举 | 定义运行状态：`pending`（等待）、`running`（运行中）、`completed`（完成）、`failed`（失败）、`cancelled`（取消） |
| **manager.py** | `RunManager`, `RunRecord` | 管理所有正在进行的运行。`RunRecord` 记录每次运行的 ID、状态、线程 ID、创建时间等 |
| **worker.py** | `run_agent()` | 后台执行 Agent 的"工人函数"。调用 Agent 的 `astream()` 方法，把产生的事件序列化后发布到 StreamBridge |

**run_agent 的工作流程**：

```
run_agent(thread_id, input, config)
    │
    ├── 1. 创建 Agent 实例（或使用已有的）
    ├── 2. 调用 agent.astream(input, config) 开始流式执行
    ├── 3. 对于产生的每个事件：
    │      ├── 用 serialize() 转成 JSON 格式
    │      └── 发布到 StreamBridge
    ├── 4. 执行完成后发送结束信号
    └── 5. 如果出错，发送错误信息
```

##### runtime/stream_bridge/ — 流式传输桥

流桥是连接 Agent 运行和 HTTP 响应的"管道"。

| 文件 | 重要类 | 作用 |
|------|--------|------|
| **base.py** | `StreamEvent`, `StreamBridge` | 定义流事件格式和抽象的流桥接口 |
| **memory.py** | `MemoryStreamBridge` | 内存中的发布-订阅系统。Agent 产生事件 → 发布到桥 → SSE 路由从桥中读取 → 返回给浏览器 |

**通俗理解**：流桥就像寿司店的"传送带"。厨师（Agent）把做好的寿司（事件）放到传送带上，顾客（浏览器）从传送带上取走。

##### runtime/serialization.py — 数据序列化

**核心函数：`serialize(event)`**

把 LangChain/LangGraph 的内部对象（消息、工具调用等）转换成 JSON 格式，这样才能通过网络传输给浏览器。

通俗理解：把中文翻译成英文才能和外国人交流——把 Python 对象"翻译"成 JSON 文本才能传给浏览器。

##### runtime/store/ — 状态存储

LangGraph 的 Store 用来保存线程的元数据（比如搜索线程时需要的信息）。

| 文件 | 作用 |
|------|------|
| **provider.py** | 同步 Store 工厂（开发/CLI 用） |
| **async_provider.py** | 异步 Store 工厂（网关用） |
| **_sqlite_utils.py** | SQLite 连接字符串处理工具 |

---

#### config/ — 配置系统

整个配置系统负责读取和管理 `config.yaml` 中的各种设置。

**核心文件：`app_config.py`**

| 函数 | 作用 |
|------|------|
| `get_app_config()` | 获取当前配置（单例模式，只加载一次） |
| `reload_app_config()` | 重新加载配置文件（配置变更后使用） |
| `AppConfig` | 配置数据类，包含所有子配置（模型、工具、沙箱等） |

**配置加载流程**：

```
程序启动
    │
    ├── 读取 config.yaml 文件
    ├── 解析 YAML 内容
    ├── 替换环境变量（$GEMINI_API_KEY → 实际的密钥值）
    ├── 验证配置格式
    └── 创建 AppConfig 对象，缓存供后续使用
```

**其他配置文件**功能一览：

| 文件 | 对应 config.yaml 区域 | 作用 |
|------|---------------------|------|
| `model_config.py` | `models` | 模型配置的数据类 |
| `tool_config.py` | `tools` | 工具配置的数据类 |
| `sandbox_config.py` | `sandbox` | 沙箱配置 |
| `memory_config.py` | `memory` | 记忆系统配置 |
| `summarization_config.py` | `summarization` | 摘要功能配置 |
| `checkpointer_config.py` | `checkpointer` | 检查点配置 |
| `title_config.py` | `title` | 标题生成配置 |
| `skills_config.py` | `skills` | 技能路径配置 |
| `extensions_config.py` | `extensions_config.json` | MCP 和技能开关配置 |
| `paths.py` | — | 文件路径管理（workspace/uploads/outputs） |

---

#### subagents/ — 子智能体系统

子智能体是被主智能体委派去执行具体任务的"下属"。

| 文件 | 重要类/函数 | 作用 |
|------|------------|------|
| **config.py** | `SubagentConfig` | 子智能体的配置：名称、描述、系统提示词、可用工具组等 |
| **registry.py** | `get_subagent_config()`, `list_subagents()` | 子智能体注册表，管理所有可用的子智能体类型 |
| **executor.py** | `SubagentExecutor`, `SubagentResult` | 子智能体执行器。接收主智能体的任务 → 创建子 Agent → 执行 → 返回结果 |
| **builtins/general_purpose.py** | — | 通用型子智能体（什么都能做） |
| **builtins/bash_agent.py** | — | 专门执行 Bash 命令的子智能体 |

**子智能体的工作流程**：

```
主智能体收到任务："帮我分析这个 CSV 文件"
    │
    ├── 1. 主智能体决定需要子智能体帮忙
    ├── 2. 调用 task_tool，描述子任务
    ├── 3. SubagentExecutor 收到任务
    ├── 4. 创建子 Agent（带有精简的工具集）
    ├── 5. 子 Agent 执行任务（读文件、运行代码、生成报告）
    ├── 6. 返回 SubagentResult（执行结果）
    └── 7. 主智能体收到结果，继续回复用户
```

通俗理解：主智能体是"项目经理"，子智能体是"技术专员"。项目经理把具体任务分配给专员，专员做完后汇报结果。

---

#### community/ — 社区集成

这些是第三方服务的集成，为 AI 提供搜索、爬虫等能力。

| 目录 | 服务 | 提供的工具 |
|------|------|-----------|
| **tavily/** | Tavily 搜索引擎 | `web_search_tool` — 高质量网页搜索 |
| **ddg_search/** | DuckDuckGo 搜索 | `web_search_tool` — 免费的网页搜索 |
| **firecrawl/** | Firecrawl 爬虫 | `web_fetch_tool` — 爬取网页内容 |
| **jina_ai/** | Jina AI | `web_fetch_tool` — 网页内容获取和处理 |
| **infoquest/** | InfoQuest | `search_tool` — 信息搜索 |
| **image_search/** | 图片搜索 | `image_search_tool` — DuckDuckGo 图片搜索 |
| **aio_sandbox/** | 远程沙箱 | `AioSandboxProvider` — Docker 容器沙箱 |

---

#### guardrails/ — 安全护栏

防止 AI 做出危险操作的安全机制。

| 文件 | 作用 |
|------|------|
| **provider.py** | 定义 `GuardrailProvider` 协议和 `GuardrailDecision`（放行/拒绝/修改） |
| **builtin.py** | `AllowlistProvider` — 基于白名单的护栏，只允许执行白名单中的操作 |
| **middleware.py** | `GuardrailMiddleware` — 在每次工具调用前进行安全检查 |

通俗理解：就像银行柜台的"安全审核"，每笔交易（工具调用）都要经过安全检查才能执行。

---

#### reflection/ — 反射系统

**核心函数**：

- `resolve_variable(path_string)` — 根据字符串路径动态导入 Python 对象
  - 输入：`"deerflow.community.ddg_search:web_search_tool"`
  - 输出：实际的 `web_search_tool` 函数对象
  
- `resolve_class(path_string)` — 根据字符串路径动态导入 Python 类
  - 输入：`"langchain_google_genai:ChatGoogleGenerativeAI"`
  - 输出：`ChatGoogleGenerativeAI` 类

通俗理解：你告诉程序"去 XXX 小区 3 号楼 502 找张三"（一个字符串地址），程序就真的去那里把"张三"带回来（一个实际的 Python 对象）。这让配置文件可以灵活地指定用哪个类，而不需要写死在代码里。

---

#### uploads/ — 文件上传管理

**manager.py 中的重要函数**：

| 函数 | 作用 |
|------|------|
| `ensure_uploads_dir(thread_id)` | 确保上传目录存在，不存在就创建 |
| `list_files_in_dir(dir)` | 列出目录中的所有文件 |
| `enrich_file_listing(result, thread_id)` | 给文件列表添加虚拟路径和下载 URL |
| `claim_unique_filename(name, seen)` | 确保文件名唯一（重名时自动加后缀） |
| `delete_file_safe(dir, filename)` | 安全删除文件（防止路径穿越攻击） |
| `PathTraversalError` | 路径穿越攻击的异常类 |

**路径穿越攻击**是什么？如果攻击者上传文件名为 `../../etc/passwd` 的文件，可能会覆盖系统文件。`delete_file_safe` 会检测并阻止这种行为。

---

#### utils/ — 工具函数

| 文件 | 重要函数 | 作用 |
|------|---------|------|
| **network.py** | `PortAllocator`, `get_free_port()` | 寻找可用的网络端口号 |
| **file_conversion.py** | `convert_file_to_markdown()` | 把 PDF、PPT、Excel、Word 文件转换成 Markdown 格式，方便 AI 阅读 |
| **readability.py** | `ReadabilityExtractor`, `Article` | 从 HTML 网页中提取正文内容（去掉广告、导航栏等干扰信息） |

---

## 第五部分：frontend/ 前端讲解

前端使用 **Next.js 16**（基于 React 的前端框架）构建，采用 **App Router**（基于文件系统的路由方式）。

### 整体架构

```
浏览器
    │
    ├── 首页 (page.tsx)
    │   营销落地页，展示产品特色
    │
    └── 工作区 (workspace/)
        ├── 聊天页面 (chats/)
        │   用户和 AI 对话的主要界面
        │
        └── Agent 管理 (agents/)
            创建和管理自定义 Agent
```

### src/app/ — 页面路由

在 Next.js 中，文件路径就是网页的 URL 路径。

| 文件路径 | 对应 URL | 功能 |
|---------|---------|------|
| `app/page.tsx` | `/` | 首页落地页：展示 Hero（主题横幅）、案例、技能介绍等 |
| `app/layout.tsx` | 所有页面 | 根布局：设置主题（亮/暗）、国际化（中/英）、全局字体等 |
| `app/workspace/layout.tsx` | `/workspace/*` | 工作区布局：左侧边栏 + 右侧主内容区 |
| `app/workspace/page.tsx` | `/workspace` | 工作区入口：自动跳转到聊天页面 |
| `app/workspace/chats/page.tsx` | `/workspace/chats` | 聊天列表页 |
| `app/workspace/chats/[thread_id]/page.tsx` | `/workspace/chats/xxx` | 具体对话页面（核心页面） |
| `app/workspace/agents/page.tsx` | `/workspace/agents` | Agent 画廊：展示所有可用的 Agent |
| `app/workspace/agents/new/page.tsx` | `/workspace/agents/new` | 创建新 Agent 的页面 |

**`[thread_id]` 是什么？** 这是 Next.js 的**动态路由**。方括号表示这部分 URL 是可变的。比如 `/workspace/chats/abc123` 和 `/workspace/chats/def456` 都会匹配到同一个页面组件，但 `thread_id` 分别是 `abc123` 和 `def456`。

### src/core/ — 核心业务逻辑

这里存放的是与 UI 无关的业务逻辑，比如 API 调用、数据管理等。

| 目录 | 功能 | 关键文件/Hook |
|------|------|-------------|
| **api/** | API 客户端封装 | `getAPIClient()` — 创建 LangGraph SDK 客户端 |
| **threads/** | 对话线程管理 | `useThreadStream` — 最核心的 Hook，管理与 AI 的实时通信 |
| **agents/** | Agent 管理 | Agent 的增删改查 API |
| **settings/** | 用户设置 | `useLocalSettings` — 用 localStorage 保存用户偏好 |
| **i18n/** | 国际化 | `useI18n` — 切换中/英文 |
| **config/** | 前端配置 | `getLangGraphBaseURL()` — 获取后端 API 地址 |
| **tasks/** | 子任务状态 | `SubtasksProvider` — 管理子任务的展开/折叠 |
| **artifacts/** | 产出物管理 | 查看 Agent 生成的文件 |
| **uploads/** | 文件上传 | 上传文件到对话 |
| **mcp/** | MCP 配置 | 前端管理 MCP 服务器连接 |
| **models/** | 模型信息 | 获取可用模型列表 |
| **skills/** | 技能管理 | 查看/启用/禁用技能 |
| **memory/** | 记忆管理 | 查看/编辑 AI 的长期记忆 |
| **streamdown/** | 流式 Markdown | 实时渲染 AI 输出的 Markdown 文本 |

**核心 Hook 详解**：

**`useThreadStream`**（位于 `core/threads/hooks.ts`）：

这是前端最核心的 Hook（React 自定义钩子），负责与后端 AI 的实时通信。

```
useThreadStream 的工作流程：

用户输入消息
    │
    ├── 1. 调用 LangGraph SDK 的 useStream
    ├── 2. 建立 SSE 连接到后端
    ├── 3. 接收流式事件
    │      ├── "values" → 更新整个对话状态（标题、消息列表等）
    │      ├── "messages-tuple" → AI 的逐字输出
    │      └── "end" → 对话结束
    ├── 4. 实时更新 UI
    └── 5. 处理上传文件、错误提示等
```

通俗理解：`useThreadStream` 就像一个"电话接线员"。你说一句话（用户消息），接线员把你的话转达给 AI，然后 AI 的回答通过接线员一个字一个字地传回来。

**`useThreadChat`**（位于 `components/workspace/chats/use-thread-chat.ts`）：

从 URL 中提取 `thread_id`，管理当前对话的上下文：
- 如果 URL 是 `/workspace/chats/new`，生成一个新的 UUID 作为 thread_id
- 如果 URL 包含 `?mock=true`，使用模拟 API（用于演示）

### src/components/ — UI 组件

| 目录 | 功能 | 重要组件 |
|------|------|---------|
| **workspace/** | 工作区相关 | `WorkspaceSidebar`（侧边栏）、`WorkspaceHeader`（顶部栏）、`InputBox`（消息输入框） |
| **workspace/chats/** | 聊天组件 | `ChatBox`（聊天容器）、`MessageList`（消息列表）、`Welcome`（欢迎页） |
| **workspace/messages/** | 消息渲染 | Markdown 渲染、代码高亮、子任务展示 |
| **workspace/settings/** | 设置面板 | 外观设置、记忆设置、工具设置、技能管理、通知设置 |
| **workspace/artifacts/** | 产出物 | 展示 AI 生成的文件，可下载 |
| **workspace/agents/** | Agent 管理 | `AgentGallery`（Agent 画廊）、`AgentCard`（Agent 卡片） |
| **landing/** | 落地页 | `Hero`（主横幅）、`Header`（导航栏）、`Footer`（页脚） |
| **ai-elements/** | AI 元素 | `PromptInput`（提示输入框）、代码块、推理过程展示 |
| **ui/** | 基础组件 | 按钮、对话框、滚动区域、标签页等（基于 Radix UI） |

### 关键前端技术

| 技术 | 用途 | 通俗解释 |
|------|------|---------|
| **TanStack React Query** | 服务器状态管理 | 自动管理 API 请求的发送、缓存、重试、刷新 |
| **Radix UI** | 无障碍 UI 组件 | 提供可访问性良好的基础组件（按钮、对话框等），DeerFlow 在此基础上定制样式 |
| **LangGraph SDK useStream** | AI 流式通信 | 封装了 SSE 连接的建立、事件解析、重连等复杂逻辑 |
| **next-themes** | 主题切换 | 实现亮色/暗色主题切换 |
| **better-auth** | 用户认证 | 处理用户登录、注册（可选功能） |
| **class-variance-authority** | 样式变体 | 方便地定义组件的不同样式变体（如 `size="sm"` / `size="lg"`） |
| **tailwind-merge** | 样式合并 | 智能合并 Tailwind CSS 类名，避免冲突 |
| **Sonner** | 消息提示 | 显示操作成功/失败的弹窗通知 |
| **cmdk** | 命令面板 | 按 Ctrl+K 打开快速命令面板 |
| **shiki** | 代码高亮 | AI 输出代码时的语法高亮显示 |
| **KaTeX** | 数学公式 | 渲染 AI 输出的数学公式 |

---

## 第六部分：docker/ 部署讲解

### docker-compose.yaml — 生产环境编排

生产环境启动 4 个服务：

```
docker-compose.yaml 定义的服务：

┌─────────┐     ┌──────────┐     ┌──────────┐     ┌───────────┐
│  nginx  │────→│ frontend │     │ gateway  │     │ langgraph │
│ :2026   │────→│  :3000   │     │  :8001   │     │   :2024   │
│         │────→│          │     │          │     │           │
└─────────┘     └──────────┘     └──────────┘     └───────────┘
   统一入口        网页界面         API 网关         AI 运行时
```

**关键配置**：
- 所有服务共享 `config.yaml` 和 `extensions_config.json`
- 通过 Docker 卷（volume）映射文件
- 环境变量从根目录的 `.env` 文件加载
- 可选的 `provisioner` 服务用于 Kubernetes 沙箱

### docker-compose-dev.yaml — 开发环境编排

与生产版的区别：
- 挂载源代码目录（修改代码后**自动重载**，不需要重新构建）
- 映射日志文件到 `logs/` 目录
- 使用命名卷保护虚拟环境（`.venv`）不被覆盖

### Dockerfile 构建流程

**后端 Dockerfile**（`backend/Dockerfile`）：
```
基础镜像：Python 3.12
    │
    ├── 安装 Node.js 22（MCP 工具需要 npx 命令）
    ├── 安装 Docker CLI（用于启动沙箱容器）
    ├── 安装 uv（Python 包管理器）
    ├── uv sync 安装 Python 依赖
    └── 暴露端口 8001（网关）和 2024（LangGraph）
```

**前端 Dockerfile**（`frontend/Dockerfile`）：
```
基础镜像：Node.js 22 Alpine
    │
    ├── 安装 pnpm（包管理器）
    ├── pnpm install 安装依赖
    ├── dev 目标：pnpm dev（开发模式，热重载）
    └── prod 目标：pnpm build → pnpm start（生产模式）
```

### Nginx 配置

Nginx 作为反向代理，是所有请求的统一入口：

```
用户的请求 → Nginx (端口 2026)
    │
    ├── /api/langgraph/*  → 转发给 LangGraph 服务 (端口 2024)
    │   这里处理 AI 对话、流式输出
    │
    ├── /api/*            → 转发给 Gateway 网关 (端口 8001)
    │   这里处理模型管理、文件上传、技能管理等
    │
    └── /*                → 转发给 Frontend 前端 (端口 3000)
        这里提供网页界面
```

通俗理解：Nginx 就像酒店的前台，客人说"我要吃饭"就指引去餐厅，说"我要健身"就指引去健身房，说"我要入住"就办理入住。

---

## 第七部分：scripts/ 脚本讲解

| 脚本 | 命令 | 作用 |
|------|------|------|
| **configure.py** | `make config` | 交互式生成 `config.yaml`，引导你选择模型、填写 API 密钥 |
| **config-upgrade.sh** | `make config-upgrade` | 配置版本升级，把新字段合并到你现有的 `config.yaml` 中 |
| **check.py / check.sh** | `make check` | 检查你的电脑是否安装了必要的软件（Node.js、Python、pnpm、uv 等） |
| **serve.sh** | `make dev` | 启动本地开发环境（同时启动前端、网关、LangGraph 三个服务） |
| **start-daemon.sh** | `make dev-daemon` | 后台启动开发环境 |
| **deploy.sh** | `make up` | 用 Docker Compose 部署生产环境 |
| **docker.sh** | `make docker-init/start/stop` | 管理 Docker 开发环境的生命周期 |
| **cleanup-containers.sh** | `make stop` 时调用 | 清理沙箱产生的临时 Docker 容器 |
| **wait-for-port.sh** | 内部使用 | 等待某个端口可用后再继续（确保服务已启动） |
| **export_claude_code_oauth.py** | 手动运行 | 导出 Claude Code 的 OAuth 认证信息 |
| **load_memory_sample.py** | 手动运行 | 加载示例记忆数据（用于测试） |

---

## 第八部分：skills/ 技能讲解

所有内置技能都在 `skills/public/` 目录下，每个技能是一个文件夹，核心文件是 `SKILL.md`。

| 技能 | 用途 | 包含的脚本/模板 |
|------|------|----------------|
| **deep-research** | 深度研究 — 对某个主题进行全面的网络搜索、资料收集和报告撰写 | SKILL.md |
| **chart-visualization** | 图表可视化 — 生成各种图表（折线图、饼图、柱状图、思维导图、桑基图等 26 种） | `scripts/generate.js` + 26 个图表类型的参考文档 |
| **data-analysis** | 数据分析 — 对 CSV、Excel 等数据文件进行统计分析 | `scripts/analyze.py` |
| **ppt-generation** | PPT 生成 — 自动创建演示文稿 | `scripts/generate.py` |
| **podcast-generation** | 播客生成 — 生成播客脚本和音频 | `scripts/generate.py` + 模板 |
| **video-generation** | 视频生成 — 创建视频内容 | `scripts/generate.py` |
| **image-generation** | 图片生成 — AI 绘图 | `scripts/generate.py` + 模板 |
| **frontend-design** | 前端设计 — 生成 HTML/CSS 网页设计 | SKILL.md |
| **web-design-guidelines** | 网页设计规范 — 提供设计最佳实践 | SKILL.md |
| **consulting-analysis** | 咨询分析 — 商业咨询和市场分析 | SKILL.md |
| **github-deep-research** | GitHub 深度研究 — 深入分析 GitHub 仓库 | `scripts/github_api.py` + 报告模板 |
| **skill-creator** | 技能创建器 — 帮助你创建新的自定义技能 | 多个脚本和参考文档 |
| **find-skills** | 技能搜索 — 搜索和安装社区技能 | `scripts/install-skill.sh` |
| **bootstrap** | 初始化引导 — 帮助新用户设置 Agent 的个性和偏好 | 对话引导模板 |
| **surprise-me** | 惊喜功能 — 随机展示一个有趣的功能 | SKILL.md |
| **claude-to-deerflow** | Claude 迁移 — 从 Claude 迁移到 DeerFlow | 迁移脚本 |
| **vercel-deploy-claimable** | Vercel 部署 — 一键部署到 Vercel 平台 | `scripts/deploy.sh` |

---

## 第九部分：核心流程讲解

### 流程一：用户发送消息的完整流程

```
1. 用户在浏览器输入框输入 "帮我搜索 Python 教程"，点击发送

2. 前端处理
   ├── useThreadStream Hook 捕获消息
   ├── 通过 LangGraph SDK 发送 POST 请求
   └── 请求路径: /api/langgraph/threads/{thread_id}/runs

3. Nginx 转发
   └── 识别 /api/langgraph/ 前缀，转发到 LangGraph 服务（端口 2024）

4. LangGraph 服务处理
   ├── 加载/创建线程状态（从 SQLite 检查点恢复）
   │
   ├── 执行中间件链：
   │   ├── ThreadDataMiddleware → 设置工作目录
   │   ├── UploadsMiddleware → 检查是否有上传文件
   │   ├── SandboxMiddleware → 准备沙箱环境
   │   ├── SummarizationMiddleware → 检查对话是否太长
   │   ├── TitleMiddleware → 如果是首条消息，生成标题
   │   └── ...其他中间件
   │
   ├── AI 模型处理：
   │   ├── 读取系统提示词（包含技能、记忆等）
   │   ├── 分析用户消息
   │   ├── 决定调用 web_search 工具
   │   ├── 执行搜索：DuckDuckGo 搜索 "Python 教程"
   │   ├── 获取搜索结果
   │   ├── 整理结果，生成回复
   │   └── 可能继续调用 web_fetch 获取网页详情
   │
   └── 流式输出（SSE）：
       ├── 发送 "正在搜索..."
       ├── 发送工具调用事件
       ├── 发送搜索结果
       └── 发送最终回复

5. 前端接收
   ├── useThreadStream 接收 SSE 事件
   ├── 实时更新消息列表
   ├── 显示 AI 的回复（打字机效果）
   └── 更新对话标题

6. 状态保存
   ├── 检查点保存到 SQLite（对话可恢复）
   └── 记忆系统异步更新（提取用户偏好）
```

### 流程二：文件上传流程

```
1. 用户拖拽文件到输入框
   └── 浏览器发送 POST /api/threads/{thread_id}/uploads（multipart/form-data）

2. Nginx → Gateway（端口 8001）

3. Gateway 处理（routers/uploads.py）
   ├── 验证文件安全性
   ├── 存储到 .deer-flow/threads/{thread_id}/user-data/uploads/
   ├── 如果是 PDF/PPT/Word → 自动转换为 Markdown
   └── 返回文件信息（路径、虚拟路径、下载 URL）

4. 用户发送引用文件的消息

5. UploadsMiddleware 处理
   ├── 列出上传目录中的文件
   └── 把文件清单注入到消息中
       "用户上传了: doc.pdf（虚拟路径: /mnt/user-data/uploads/doc.pdf）"

6. AI 可以通过虚拟路径读取文件
   └── read_file("/mnt/user-data/uploads/doc.pdf")
       → 沙箱映射到真实路径并读取
```

### 流程三：工具调用流程

```
AI 决定需要使用工具（比如执行 Python 代码）

1. AI 生成工具调用请求
   {
     "name": "bash",
     "args": {"command": "python3 -c 'print(1+1)'"}
   }

2. LangGraph 拦截工具调用

3. 查找对应的工具函数
   config.yaml 中 bash 工具的 use 路径
   → deerflow.sandbox.tools:bash_tool

4. 安全检查
   ├── SandboxMiddleware 确保有沙箱可用
   ├── GuardrailMiddleware 检查命令是否安全（如果启用）
   └── 虚拟路径验证

5. 在沙箱中执行
   ├── 本地沙箱：直接在系统上执行
   └── Docker 沙箱：在容器中执行

6. 返回结果
   {
     "output": "2\n",
     "exit_code": 0
   }

7. AI 收到结果，继续生成回复
   "执行结果显示 1+1=2"
```

---

## 附录：快速上手指南

### 本地开发环境搭建

```bash
# 1. 生成配置文件
make config

# 2. 编辑 .env 填入 API 密钥
# 至少需要一个 AI 模型的密钥（如 GEMINI_API_KEY）

# 3. 检查环境
make check

# 4. 安装依赖
make install

# 5. 启动开发环境
make dev

# 6. 打开浏览器访问 http://localhost:2026
```

### Docker 部署

```bash
# 1. 初始化 Docker 环境
make docker-init

# 2. 启动所有服务
make up

# 3. 打开浏览器访问 http://localhost:2026

# 4. 停止服务
make down
```

---

## 附录：术语索引

| 术语 | 全称 | 解释 |
|------|------|------|
| Agent | — | 能自主思考和行动的 AI 程序 |
| API | Application Programming Interface | 程序之间通信的接口规范 |
| API Key | — | API 密钥，用来验证你的身份 |
| CI/CD | Continuous Integration / Continuous Deployment | 持续集成/持续部署，自动化测试和发布 |
| CORS | Cross-Origin Resource Sharing | 跨域资源共享，浏览器安全策略 |
| Debounce | — | 防抖，短时间内多次触发只执行最后一次 |
| Docker | — | 容器化工具，打包应用和环境 |
| FastAPI | — | Python Web 框架，快速构建 API |
| Hook | — | React 中的"钩子"函数，用于在组件中使用状态和生命周期 |
| JSON | JavaScript Object Notation | 一种轻量级数据交换格式 |
| JWT | JSON Web Token | 用于用户认证的令牌 |
| LangChain | — | AI 应用开发框架 |
| LangGraph | — | 基于 LangChain 的工作流编排框架 |
| MCP | Model Context Protocol | 模型上下文协议，连接外部工具 |
| Middleware | — | 中间件，处理请求的流水线环节 |
| Next.js | — | React 全栈框架 |
| Nginx | — | 高性能 Web 服务器和反向代理 |
| OAuth | Open Authorization | 开放授权协议 |
| pnpm | performant npm | 高效的 Node.js 包管理器 |
| React | — | 前端 UI 组件库 |
| REST | Representational State Transfer | 一种 API 设计风格 |
| SDK | Software Development Kit | 软件开发工具包 |
| SSE | Server-Sent Events | 服务器推送事件，单向实时通信 |
| SQLite | — | 轻量级文件数据库 |
| Tailwind CSS | — | 原子化 CSS 框架 |
| Token | — | AI 模型处理文本的最小单位（约等于一个字或词） |
| TypeScript | — | JavaScript 的强类型版本 |
| UUID | Universally Unique Identifier | 全局唯一标识符 |
| uv | — | 快速的 Python 包管理器 |
| YAML | YAML Ain't Markup Language | 一种易读的配置文件格式 |
