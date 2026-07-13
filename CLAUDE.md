# 医疗智能问诊平台 - Medical Consultation Platform

基于大语言模型的多模型兼容医疗动态问诊 Web 系统，支持 AI 智能问诊、病历文件解析、企业微信集成。

## 技术栈

- **框架**: Next.js 14 (App Router) + React 18
- **语言**: TypeScript (strict)
- **UI**: Chakra UI + 自定义医疗组件
- **状态管理**: Zustand
- **数据库**: MongoDB + PGVector (向量)
- **缓存/队列**: Redis + BullMQ
- **文件存储**: MinIO (S3 兼容)
- **AI 模型**: OpenAI 兼容接口 (DeepSeek / Qwen / OpenAI)
- **OCR**: PaddleOCR (Python 微服务)
- **企微**: wxcrypt + @neuit/wecom

## 项目结构

```
medical-consultation-platform/
├── packages/
│   ├── global/          # 共享类型、常量、Zod Schema
│   ├── service/         # 业务逻辑引擎
│   └── web/             # 共享 React UI 组件
├── projects/
│   └── app/             # 主 Next.js 应用
├── services/
│   └── ocr-service/     # PaddleOCR Python 微服务
└── docker-compose.yml   # 一键部署
```

## 快速启动

### 1. 安装依赖
```bash
pnpm install
```

### 2. 启动基础设施
```bash
docker-compose up -d
```

### 3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 填入 API Key 等配置
```

### 4. 启动开发服务器
```bash
pnpm dev
```

### 5. 访问
- 前端: http://localhost:3000
- MinIO Console: http://localhost:9001

## 开发指南

### workspace 包引用
```typescript
// 从 @medical/global 引用类型
import type { MedicalRecord, Conversation } from '@medical/global';

// 从 @medical/service 引用业务逻辑
import { connectDB } from '@medical/service';

// 从 @medical/web 引用 UI 组件
import { ChatContainer, FileUploadZone } from '@medical/web';
```

### API 路由
- `POST /api/chat/completions` - 对话接口 (OpenAI 兼容 + SSE 流式)
- `POST /api/medical-record/upload` - 病历上传
- `GET  /api/medical-record/status/:id` - 解析进度
- `GET  /api/medical-record/result/:id` - 解析结果
- `GET  /api/wxwork/callback` - 企微 URL 验证
- `POST /api/wxwork/callback` - 企微消息回调

## 环境变量

参见 `.env.example` 文件。

## 医学领域说明

### 病历标准结构
中文病历遵循以下结构：主诉 → 现病史 → 既往史 → 体格检查 → 辅助检查 → 诊断 → 治疗意见

### 数据隐私
- 符合 PIPL (个人信息保护法)
- 病历解析前自动脱敏 (姓名、身份证号、手机号、地址)
- 文件加密存储于 MinIO
- AI 输出附免责声明
