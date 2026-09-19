# 🏥 AI Medical Consultation Platform · 医疗智能问诊平台

<div align="center">

**基于大语言模型（LLM）的智能医疗问诊平台** —— 递进式多轮问诊引擎 · 病历 OCR 智能结构化 · 3D 人体健康地图 · 多模型适配 · 企业微信集成

<br/>

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![LLM](https://img.shields.io/badge/LLM-DeepSeek%20%7C%20Qwen%20%7C%20OpenAI-7B68EE)
![License](https://img.shields.io/badge/License-MIT-green)

<br/>

*An LLM-powered medical consultation platform with an  8-stage progressive triage dialogue engine, SSE streaming,*
*OCR-based medical-record structuring, an interactive 3D body health map, a unified multi-LLM adapter and WeCom integration.*

</div>

> ⚕️ **免责声明**：本项目仅用于技术学习与交流，**不构成任何医疗诊断或治疗建议**，不能替代专业医生的判断。

## 🌟 项目亮点

- **8 阶段递进式问诊引擎**：主诉采集 → 症状细节 → 病史追问 → 鉴别诊断 → 初步诊断 → 诊疗建议，由会话状态机驱动，基于 **SSE 流式输出**逐字呈现。
- **统一多模型适配层**：以一套 OpenAI 兼容接口抽象 DeepSeek / 通义千问 / OpenAI，将模型调用、Prompt、上下文管理与业务逻辑解耦，支持运行时切换与熔断。
- **病历 OCR → 结构化流水线**：PDF / JPG / PNG / DOCX 上传，经 PaddleOCR 识别、LLM 抽取（主诉 / 现病史 / 既往史 / 诊断）与医疗实体标准化。
- **3D 人体健康地图**：可拖拽旋转、缩放、点击标记的三维人体模型，状态数据由病历分析结果驱动。
- **隐私合规**：病历自动脱敏（姓名 / 证件号 / 手机号 / 地址）、MinIO 加密存储，遵循 PIPL。
- **企业微信集成**：自建应用消息收发、OAuth2 免登、AES-256-CBC 加解密。

## 📚 目录

- [✨ 核心功能](#-核心功能)
- [🏗️ 技术架构](#️-技术架构)
- [⚠️ 配置 API Key](#️-配置-api-key克隆后必须操作)
- [🚀 快速开始](#-快速开始)
- [📖 使用指南](#-使用指南)
- [📁 项目结构](#-项目结构)
- [🔧 API 接口](#-api-接口)
- [⚠️ 免责声明](#-免责声明)
- [📄 License](#-license)

---

## ✨ 核心功能

- **🤖 AI 智能问诊**：递进式多轮对话引擎，模拟真实医生问诊流程。从主诉采集 → 症状细节 → 病史追问 → 鉴别诊断 → 初步诊断 → 诊疗建议，共 8 个阶段递进推进。支持 SSE 流式输出，实时展示 AI 回复内容。
- **📋 病历文件解析**：支持 PDF / JPG / PNG / DOCX 多格式上传，自动 OCR 文字识别 + AI 结构化提取（主诉、现病史、既往史、诊断等），并提供 AI 用药建议分析和丁香园相关文章推荐。
- **🫀 3D 人体健康地图**：交互式三维人体模型，可拖拽旋转、滚轮缩放、点击部位标记健康状态（健康/观察中/异常），数据源自病历分析结果。
- **👤 个人健康档案**：管理基本信息（性别、血型、身高、体重）、过敏史、慢性病史。汇总问诊记录与病历统计，一目了然。
- **🔌 多模型兼容**：统一 OpenAI 兼容接口适配层，支持 DeepSeek V3、通义千问 Plus、OpenAI GPT 系列，可在对话中灵活切换。
- **💬 企业微信集成**：自建应用接入，支持企微内消息收发、OAuth2 身份认证、消息加解密，实现企业微信内的 AI 问诊服务。
- **📚 知识库 RAG**（规划中）：医学知识文档管理，语义检索 + 全文搜索，增强 AI 诊断的准确性和专业性。类型定义和架构设计已完成，待实现。
- **🔒 隐私保护**：自动病历脱敏（姓名、身份证号、手机号、地址）、数据加密存储（MinIO）、符合 PIPL 要求。

## 🏗️ 技术架构

```
前端 (Next.js 14 + React 18 + Chakra UI)
    ↕ HTTP/SSE
API 网关 (Next.js API Routes)
    ↕
服务层 (TypeScript)
 ├── 对话引擎 (多轮问诊 + SSE 流式 + 8 阶段推进)
 ├── 模型适配 (DeepSeek/Qwen/OpenAI 统一接口 + 熔断)
 ├── 病历解析 (PDF/OCR/DOCX → 脱敏 → 结构化 → 标准化)
 ├── 企微服务 (加解密 + OAuth + 消息收发)
 └── RAG 检索 (规划中 — 语义搜索 + 全文搜索)
    ↕
数据层 (MongoDB + Redis + MinIO)
    +
外部服务 (PaddleOCR Python 微服务)
```

## ⚠️ 配置 API Key（克隆后必须操作）

本项目已移除所有真实 API Key，克隆后**必须**替换以下文件中的占位符才能运行：

### 需要替换的文件

| 文件 | 需要替换的 Key | 申请地址 |
|------|---------------|----------|
| `.env` | **必填：** `DEEPSEEK_API_KEY` | https://platform.deepseek.com/api_keys |
| | 可选：`QWEN_API_KEY` | https://dashscope.console.aliyun.com/apiKey |
| | 可选：`OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| | 可选：`BAIDU_OCR_API_KEY` + `BAIDU_OCR_SECRET_KEY` | https://console.bce.baidu.com/ai/#/ai/ocr/overview/index |
| | 可选：`WXWORK_*`（企业微信 5 个字段） | https://work.weixin.qq.com/ |
| `projects/app/.env.local` | 同上（本地开发覆盖文件） | 同上 |

### 快速替换命令

```bash
# 方式一：手动编辑（推荐）
# 用编辑器打开 .env，搜索 YOUR_ 替换所有匹配项
# 至少需要替换 DEEPSEEK_API_KEY 一项

# 方式二：一键 sed 批量替换（macOS/Linux）
sed -i 's/YOUR_DEEPSEEK_API_KEY/sk-你的真实key/g' .env
sed -i 's/YOUR_DEEPSEEK_API_KEY/sk-你的真实key/g' projects/app/.env.local

# 方式三：VS Code 全局搜索替换
# Ctrl+Shift+F → 搜索 "YOUR_" → 逐个替换
```

### 最少配置（快速跑通）

只需申请一个 **DeepSeek API Key**（免费注册，赠送额度），然后：

```bash
# 编辑 .env 文件，修改这一行：
DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY  # 改为你的真实 key

# OCR 模式设为 none（跳过 OCR 服务，AI 问诊不受影响）
OCR_MODE=none
```

然后正常启动：

```bash
pnpm install
docker-compose up -d   # 启动 MongoDB + Redis + MinIO（OCR 可选）
pnpm dev               # http://localhost:3000
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose
- (可选) Python 3.11+ 用于 OCR 服务本地开发

### 1. 克隆项目

```bash
git clone <repo-url> medical-consultation-platform
cd medical-consultation-platform
```

### 2. 启动基础设施

```bash
docker-compose up -d
```

启动以下服务（4 个容器）：
- MongoDB 7.0 (端口 27017) — 业务数据、对话历史
- Redis 7 (端口 6379) — 缓存 + 消息队列
- MinIO (端口 9000/9001) — S3 兼容文件存储
- PaddleOCR (端口 8001) — OCR 文字识别微服务

### 3. 安装依赖

```bash
pnpm install
```

### 4. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，至少填入一个 API Key：
#   - DEEPSEEK_API_KEY (推荐，高性价比)
#   - QWEN_API_KEY (可选)
#   - OPENAI_API_KEY (可选)
#
# 提示：OCR_MODE=none 可跳过 OCR 服务配置，AI 问诊对话不受影响
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

> ⚠️ 如果提示 `Port 3000 is in use`，说明上次的 node 进程未释放：
> ```bash
> # Windows
> taskkill /F /IM node.exe
> # macOS / Linux
> killall node
> ```
> 然后重新执行 `pnpm dev`。

### 停止项目

```bash
# 终端按 Ctrl+C 停止前端
docker-compose down    # 停止 Docker 服务
```

## 📖 使用指南

### 🤖 AI 智能问诊

AI 问诊是本平台的核心功能，采用**递进式多轮对话引擎**，模拟真实医生的问诊流程。

**访问路径：** 点击左侧菜单「AI 智能问诊」或直接访问 http://localhost:3000/consultation

**问诊流程（8 个阶段）：**

| 阶段 | 说明 | 典型交互 |
|------|------|----------|
| 🟢 开始问诊 | AI 问候并引导患者描述症状 | "您好，请问有什么不舒服？" |
| 🔵 采集主诉 | 收集主要症状和发病时间 | "头痛3天了，伴有发热38°C" |
| 🟡 症状细节 | 追问症状的具体特征 | 疼痛部位、性质、加重/缓解因素 |
| 🟠 病史追问 | 了解既往病史和用药情况 | 既往是否有类似症状？在服什么药？ |
| 🔴 鉴别诊断 | AI 列举可能的诊断方向 | 结合症状分析可能的病因 |
| 🟣 初步诊断 | 给出初步判断和依据 | 综合判断 + 诊断依据 |
| 🟤 诊疗建议 | 提供就医/用药/检查建议 | 建议进一步检查 + 注意事项 |
| ✅ 问诊完成 | 汇总问诊结果，标记痊愈 | 弹出痊愈确认弹窗 |

**功能亮点：**

- **流式输出（SSE）**：AI 回复内容逐字实时展示，无需等待完整生成
- **阶段进度条**：页面顶部显示当前问诊阶段，清晰了解问诊进度
- **信息收集面板**：已采集的症状、病史等信息实时汇总展示
- **紧急情况检测**：系统自动识别紧急症状（如胸痛、呼吸困难等），优先给出就医建议
- **模型切换**：支持在设置中切换 DeepSeek / 通义千问 / OpenAI 等不同大模型
- **痊愈确认**：问诊完成后弹出痊愈确认弹窗，可标记病症为"已痊愈"

---

### 📋 病历管理

病历管理提供**上传 → 解析 → AI分析 → 文章推荐**的完整流水线。

**访问路径：** 点击左侧菜单「病历管理」或直接访问 http://localhost:3000/records

**支持的文件格式：**

| 格式 | 说明 | 处理方式 |
|------|------|----------|
| PDF | 电子病历、检验报告 | 直接提取文字 |
| JPG / PNG | 病历照片、检查单拍照 | PaddleOCR 识别后提取 |
| DOCX | Word 文档病历 | 直接提取文字 |
| TXT | 纯文本病历 | 直接读取 |

> ⚠️ 最大文件大小：20MB。图片类文件如 OCR 不可用，可手动粘贴文字内容。

**解析流水线（4 步）：**

```
文件上传 → 文字提取 (PDF/DOCX/OCR) → AI 结构化提取 → 实体标准化
```

1. **文件上传**：拖拽或点击上传，支持进度条实时显示上传百分比
2. **文字提取**：PDF/DOCX 直接提取文本；图片通过 PaddleOCR 识别；OCR 不可用时支持手动录入
3. **AI 结构化提取**：从病历文本中提取主诉、现病史、既往史、体格检查、辅助检查、诊断、治疗意见等标准字段
4. **实体标准化**：对药品名、疾病名进行标准化映射

**AI 用药分析：**

解析完成后，系统自动调用 AI 对病历进行用药分析，输出：
- **用药总结**：基于病历内容的整体用药评估
- **分类用药建议**：按药物类别分组，每组包含用途、代表药物、注意事项
- **安全提示**：药物相互作用警告和用药禁忌

**丁香园文章推荐：**

解析完成后自动检索丁香园相关医学文章，提供更多参考信息。

**病历列表操作：**
- 查看所有已上传病历，按卡片展示（文件名、大小、上传日期、解析状态）
- 支持重新解析、删除病历
- 解析状态标签：待解析 / 解析中 / 已完成 / 需录入 / 失败

---

### 👤 个人健康档案

个人健康档案集中管理用户健康信息和问诊历史。

**访问路径：** 点击左侧菜单「个人档案」或直接访问 http://localhost:3000/profile

**功能区域：**

**① 基本信息管理**
- 姓名、角色（患者/医生/管理员）、性别、血型
- 身高、体重
- 支持通过弹窗编辑更新

**② 3D 人体健康地图**
- 交互式三维人体模型，数据源自病历分析结果
- 自动标记有病史的身体部位（绿色=健康，黄色=关注，红色=异常）
- 支持拖拽旋转、滚轮缩放

**③ 健康概览统计**
- 累计问诊次数
- 需关注的病历记录数
- 过敏史标签（如青霉素过敏、海鲜过敏等）
- 慢性病史标签（如高血压、糖尿病等）

**④ 问诊记录摘要**
- 按时间列出历史症状记录
- 点击可快速跳转到 AI 问诊页面

---

### 🫀 人体健康三维可视化

独立的 3D 人体模型交互页面，用于直观展示和标记身体健康状态。

**访问路径：** 点击左侧菜单「人体可视化」或直接访问 http://localhost:3000/body-viz

**交互操作：**

| 操作 | 效果 |
|------|------|
| 🖱️ 左键拖拽 | 旋转3D人体模型 |
| 🔍 滚轮滚动 | 缩放远近 |
| 👆 点击部位 | 循环切换健康状态（健康→观察中→异常→健康） |
| ⌨️ 按 R 键 | 重置全部部位为健康 |
| ⌨️ 按 F 键 | 重置视角 |

**部位状态说明：**
- 🟢 **健康**（绿色）：该部位无活跃症状
- 🟡 **观察中**（黄色）：有既往病史或需要关注
- 🔴 **异常**（红色）：有活跃症状待处理

**功能特点：**
- 11 个身体部位独立标记（头部、颈部、胸部、腹部、左/右肩、左/右臂、腰部、左/右腿）
- 状态面板显示各部位实时状态，支持列表点击切换
- 图例面板支持批量设置选中部位状态
- 统计面板实时显示健康/观察中/异常的部位数量

---

### 💬 企业微信集成

将 AI 问诊能力接入企业微信，员工可在企微内直接使用。

**访问路径：** 企微消息回调，无需前端页面

**配置步骤：**

1. 登录 [企业微信管理后台](https://work.weixin.qq.com/)，创建自建应用
2. 获取 CorpID、AgentID、Secret
3. 配置回调 URL：`https://your-domain.com/api/wxwork/callback`
4. 在 `.env` 中填入企微相关参数：
   - `WXWORK_CORP_ID` — 企业 ID
   - `WXWORK_AGENT_ID` — 应用 AgentID
   - `WXWORK_SECRET` — 应用 Secret
   - `WXWORK_TOKEN` — 回调 Token
   - `WXWORK_ENCODING_AES_KEY` — 消息加解密 Key
5. 重启应用后，在企微中向自建应用发送消息即可使用 AI 问诊

**技术实现：**
- **消息加解密**：基于 `wxcrypt` 实现企业微信消息的 AES-256-CBC 加解密
- **OAuth2 认证**：企微内免登录，通过 OAuth2 获取用户身份
- **Token 管理**：自动管理 Access Token 的获取与刷新（5 分钟安全边际）
- **消息路由**：支持文本/图片/文件消息接收，文本消息接入 AI 对话引擎回复
- > ⚠️ 当前消息回调中的 AI 回复逻辑使用硬编码关键词匹配（头痛/发烧），已预留 `chatCompletion()` 接入点，待对接对话引擎

---

### 🔌 多模型切换

平台支持多种大语言模型，可在问诊时灵活切换。

**支持的模型：**

| 模型 | 提供商 | 说明 |
|------|--------|------|
| DeepSeek V3 | DeepSeek | 默认推荐，高性价比，中文能力强 |
| 通义千问 Plus | 阿里云 | 医学知识丰富 |
| OpenAI GPT | OpenAI | 需配置 OPENAI_API_KEY |

**切换方式：**
- 在 AI 问诊页面的设置中选择不同模型
- 通过 GET `/api/model/list` 接口查看当前可用模型列表

**技术架构：**
- 统一 OpenAI 兼容接口适配层
- 每个模型独立配置 API Key、Base URL、Model Name
- 支持运行时动态切换，无需重启服务

---

### 📚 知识库 RAG（规划中）

> ⚠️ 此功能已纳入架构设计（类型定义、文档规划），尚未完整实现。当前 AI 问诊依赖大模型自身的医学知识。

通过医学知识文档的语义检索，增强 AI 诊断的准确性和专业性。

**规划设计：**
```
用户提问 → 向量化查询 → PGVector 语义搜索 → 检索相关医学文档 → 注入 AI 上下文 → 生成回答
```

**待实现功能：**
- 医学文档上传与管理
- 文本向量化存储（PGVector）
- 语义相似度检索 + 全文搜索
- 检索结果注入对话上下文，提升 AI 回答质量

## 📁 项目结构

```
medical-consultation-platform/
├── packages/
│   ├── global/              # 共享类型、常量、Zod Schema 校验
│   ├── service/             # 业务逻辑引擎
│   │   ├── chat/            # 递进式对话引擎 + 阶段提示词模板
│   │   ├── model/           # 多模型统一适配层 + 智能路由
│   │   ├── medical-record/  # 病历解析流水线 (提取→结构化→标准化)
│   │   │   ├── extract/     # PDF/DOCX/OCR 文字提取
│   │   │   ├── structure/   # AI 结构化字段提取
│   │   │   └── normalize/   # 医疗实体标准化
│   │   ├── rag/             # 知识库语义检索（规划中）
│   │   ├── wxwork/          # 企业微信 (加解密+OAuth+消息)
│   │   ├── auth/            # JWT 认证 + 密码加密
│   │   ├── db/              # MongoDB 数据模型
│   │   ├── storage/         # MinIO / 本地文件存储
│   │   └── queue/           # BullMQ / Direct 任务队列
│   └── web/                 # 共享 React UI 组件库
│       ├── components/
│       │   ├── chat/        # ChatContainer 对话容器
│       │   ├── consultation/# ConsultationProgress 问诊进度
│       │   ├── body-map/    # BodyMap3D 3D人体模型
│       │   └── medical/     # FileUploadZone 文件上传
│       └── store/           # Zustand 全局状态 (authStore)
├── projects/
│   └── app/                 # 主 Next.js 14 应用 (App Router)
│       └── src/app/
│           ├── consultation/ # AI 智能问诊页
│           ├── records/      # 病历管理 + 上传页
│           ├── profile/      # 个人健康档案页
│           ├── body-viz/     # 3D 人体可视化页
│           ├── login/        # 登录页
│           └── api/          # API 路由 (12 个接口)
├── services/
│   └── ocr-service/         # PaddleOCR Python 微服务
├── docker-compose.yml       # 一键部署基础设施 (4个服务)
└── .env.example             # 环境变量模板
```

## 🔧 API 接口

### 对话接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat/completions` | 对话接口（OpenAI 兼容格式 + SSE 流式），支持递进式问诊阶段推进 |
| GET  | `/api/model/list` | 可用模型列表（含健康状态） |

### 病历接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/medical-record/upload` | 病历文件上传（支持实时进度） |
| GET  | `/api/medical-record/list` | 病历列表查询 |
| POST | `/api/medical-record/parse` | 触发病历 AI 解析（文字提取 + 结构化 + 用药分析） |
| GET  | `/api/medical-record/[id]` | 病历详情 |
| DELETE | `/api/medical-record/[id]` | 删除病历 |

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录（返回 JWT Token） |
| GET  | `/api/auth/profile` | 获取/更新用户档案 |

### 其他接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/consultation/summary` | 问诊症状摘要（用于个人档案展示） |
| GET  | `/api/health` | 服务健康检查 |
| GET  | `/api/wxwork/callback` | 企业微信 URL 验证 |
| POST | `/api/wxwork/callback` | 企业微信消息回调 |

## ⚠️ 免责声明

本系统提供的内容仅供参考，**不构成医疗诊断或治疗建议**。
如有身体不适，请及时前往正规医疗机构就诊。AI 辅助诊断不能替代专业医生的判断。

## 📄 License

本项目基于 [MIT License](LICENSE) 开源，完整协议见 [LICENSE](LICENSE) 文件。
