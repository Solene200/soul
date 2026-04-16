<div align="center">

# 💕 心灵奇旅 Soul

### AI 心理康复陪伴平台 · 本地优先 · 隐私友好 

[![心灵奇旅](https://img.shields.io/badge/心灵奇旅-AI心理健康平台-ff69b4?style=for-the-badge)](#-项目简介)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)](#️-技术栈)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.121-009688?style=for-the-badge&logo=fastapi)](#️-技术栈)
[![SQLite](https://img.shields.io/badge/SQLite-Local_DB-0f7ace?style=for-the-badge&logo=sqlite)](#️-技术栈)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-111111?style=for-the-badge)](#-ai-能力与模型策略)
[![SSE](https://img.shields.io/badge/SSE-Streaming_Chat-orange?style=for-the-badge)](#-核心亮点)

**一个围绕 “感知 -> 评估 -> 干预 -> 复盘” 闭环构建的 AI 心理健康管理系统。**

</div>

---

## 📖 项目简介

**心灵奇旅（Soul）** 是一个面向大学生与年轻用户的本地化 AI 心理康复陪伴平台，融合了：

- 💬 智能对话
- 🧠 心理评估
- 🏋️ 训练指导
- 📝 情绪日记
- 💕 成长墙 / 成就系统
- 📊 数据分析

项目核心目标不是只做“会聊天的页面”，而是通过结构化记录、专业量表、训练干预、AI 分析和可视化反馈，形成一个完整的心理健康支持闭环。

### 🎯 项目定位

> 一个基于 `Next.js 16 + FastAPI + SQLite + Ollama / ModelScope` 构建的本地优先 AI 心理康复平台，强调隐私保护、业务闭环与工程完整性。



## ✨ 核心亮点

### 🌟 业务亮点

- **6 大核心模块闭环联动**：对话、评估、训练、日记、成长、分析彼此不是孤岛
- **结构化情绪记录**：日记不仅存文本，还存情绪、强度、触发事件、生活维度与 AI 反馈
- **游戏化成长表达**：爱心墙、连胜、翅膀、成就徽章让用户长期反馈更直观
- **可持续复盘**：年度数据分析支持查看情绪分布、趋势和训练/评估沉淀

### 🧠 AI / 架构亮点

- **SSE 流式聊天**：前端支持分块渲染、会话恢复、停止回答、危机提示
- **多阶段对话引导**：感性安慰 -> 理性引导 -> 问题解决
- **模型动态路由**：基于隐私、复杂度和危机检测，在本地模型与云端模型间切换
- **本地优先策略**：敏感内容优先走本地模型，降低隐私泄露风险
- **跨模块派生数据链路**：日记写入后自动同步成长记录、检测成就、进入分析报表

---

## 🧩 功能模块

| 模块 | 作用 | 关键能力 |
| --- | --- | --- |
| 💬 智能对话 | 24 小时情绪陪伴 | 多轮对话、流式返回、危机检测、阶段式引导 |
| 🧠 心理评估 | 标准化心理测评 | PHQ-9、GAD-7、PSS-10、ISI、CD-RISC-10、LSAS-Brief |
| 🏋️ 训练指导 | 训练与干预 | 呼吸训练、正念冥想、认知重构、情绪调节、睡眠改善 |
| 📝 情绪日记 | 情绪记录与 AI 分析 | 模板引导、情绪强度记录、结构化输入、AI 反馈 |
| 💕 心灵奇旅之墙 | 成长可视化 | 365 天爱心墙、连胜、积极情绪、成就系统 |
| 📊 数据分析 | 年度复盘 | 情绪趋势、情绪分布、评估次数、训练时长、积极占比 |

### 💬 智能对话

- SSE 流式响应，边生成边展示
- 支持恢复当前活跃会话
- 支持中断回答与清空会话
- 内置危机关键词检测与紧急求助话术
- 支持本地模型与云端模型动态切换

### 🧠 心理评估

- 采用标准心理量表
- 自动评分、风险等级判断、结果解释、建议生成
- 支持历史记录与同量表趋势追踪
- 支持作答过程草稿自动保存与恢复

### 🏋️ 训练指导

- 6 大训练类型，12 个训练模板
- 支持训练详情、步骤引导、倒计时、暂停 / 继续
- 自动记录训练时长与用户反馈
- 支持统计训练分布与累计时长

### 📝 情绪日记

- 支持模板式引导与自由书写
- 记录多情绪与情绪强度
- 支持情绪触发事件与生活维度输入
- 写完后自动生成 AI 反馈与推荐内容

### 💕 成长墙 / 成就系统

- 365 天日历式成长记录
- 空心 / 粉心 / 翅膀心三态展示
- 自动计算连胜、积极占比、翅膀数量
- 自动检测并点亮成就徽章

### 📊 数据分析

- 按年聚合日记、评估、训练数据
- 展示核心指标、情绪趋势、情绪分布
- 支持从用户注册年份开始查看历史年度数据


---

## 🛠️ 技术栈

### 前端

```text
Next.js 16 (App Router)
React 19
TypeScript 5
Tailwind CSS 4
Fetch API
React Markdown + remark-gfm
```

### 后端

```text
FastAPI
SQLAlchemy ORM
SQLite
JWT
Ollama
httpx
```

## 🚀 快速开始

### 环境要求

- `Node.js >= 18`
- `Python >= 3.10`
- 推荐安装 `uv`
- 推荐安装 `Ollama`

### 1. 克隆项目

```bash
git clone https://github.com/Solene200/soul.git
cd soul
```

### 2. 配置后端环境变量

```bash
cp backend/.env.example backend/.env
```

建议至少配置以下变量：

```env
MODELSCOPE_API_KEY=your_api_key_here
MODELSCOPE_MODEL_NAME=Qwen/Qwen3-Next-80B-A3B-Instruct
OLLAMA_MODEL=qwen3:1.7b
```

说明：

- `OLLAMA_MODEL`：本地模型名称
- `MODELSCOPE_API_KEY`：用于复杂问题的云端模型调用
- 不配置 `MODELSCOPE_API_KEY` 时，复杂问题无法完整走云端增强链路

### 3. 启动 Ollama

```bash
ollama pull qwen3:1.7b
ollama serve
```

如果本地模型暂时不可用，部分功能会降级运行，但完整体验仍建议安装 Ollama。

### 4. 启动后端

```bash
cd backend
pip install uv
uv sync
uv run main.py
```

默认启动在：

- `http://127.0.0.1:8000`

### 5. 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认启动在：

- `http://localhost:3000`

### 6. 可选：修改前端 API 地址

如需连接非默认后端地址，可在 `frontend/.env.local` 中配置：

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

---

## 🧪 使用流程

```text
访问首页
  ↓
登录 / 注册
  ↓
进入 Dashboard
  ↓
选择六大业务模块中的任意一个开始使用
  ├─ 智能对话
  ├─ 心理评估
  ├─ 训练指导
  ├─ 情绪日记
  ├─ 心灵奇旅之墙
  └─ 数据分析
```
## ⚠️ 限制与说明

- 本项目是 **心理健康辅助工具**，不能替代专业心理咨询和诊疗
- 评估结果仅供参考，不构成医学诊断
- AI 生成内容仅作辅助建议，不构成医疗建议
- 若用户存在自伤、自杀、暴力等风险，请及时寻求专业帮助
