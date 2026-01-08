# SemanticLink - 企业级语义治理平台

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5.x-purple?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-cyan?logo=tailwindcss" alt="TailwindCSS">
</p>

SemanticLink 是一个企业级语义数据治理平台，提供从业务对象建模到数据映射、智能数据发现与分析的完整解决方案。

## ✨ 核心功能

### 📊 业务建模 (TD)

| 模块 | 功能描述 |
|------|----------|
| **业务梳理 (TD-01)** | 梳理业务目标、KPI、痛点与需求 |
| **业务对象建模 (TD-03)** | 定义和管理业务对象及其字段结构 |
| **场景编排 (TD-04)** | 编排业务场景和数据流程 |

### 🔍 数据发现 (BU)

| 模块 | 功能描述 |
|------|----------|
| **数据源管理 (BU-01)** | 管理 MySQL、Oracle、PostgreSQL 等多种数据源 |
| **资产扫描 (BU-02)** | 自动扫描数据库表结构和元数据 |
| **数据语义理解 (BU-03)** | AI 辅助理解数据含义和业务语义 |
| **候选生成 (BU-04)** | 智能生成业务对象候选项 |

### 🛠 语义治理中心 (SG)

| 模块 | 功能描述 |
|------|----------|
| **映射工作台 (SG-01)** | 可视化映射业务对象与物理表字段，支持数据源树导航 |
| **冲突检测 (SG-02)** | 检测和解决映射冲突 |
| **智能数据中心 (SG-04)** | 整合找数与问数功能，支持智能搜索和数据分析可视化 |

### ⚡ 服务执行 (EE)

| 模块 | 功能描述 |
|------|----------|
| **API 网关 (EE-05)** | 统一 API 入口和流量管理 |
| **缓存策略 (EE-06)** | 智能缓存配置和优化 |

## 🎯 特色亮点

- **🔄 智能数据中心** - 双模式切换（找数 / 问数），支持自然语言查询和丰富图表可视化
- **🌳 数据源树导航** - 按数据库类型分组展示，快速定位物理表
- **📐 可视化映射** - 拖拽式字段映射，实时映射进度反馈
- **🎨 现代化 UI** - 响应式设计，侧边栏可收缩，流畅动画效果
- **📊 丰富可视化** - 柱状图、饼图、统计卡片等多种图表类型

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

### 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
semantic/
├── src/
│   ├── App.tsx          # 主应用组件（包含所有视图）
│   ├── main.tsx         # 应用入口
│   └── index.css        # 全局样式
├── index.html           # HTML 模板
├── vite.config.ts       # Vite 配置
├── tailwind.config.js   # Tailwind 配置
├── tsconfig.json        # TypeScript 配置
└── package.json         # 项目依赖
```

## 🛠 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **样式方案**: Tailwind CSS
- **图标库**: Lucide React
- **状态管理**: React Hooks (useState)

## 📸 界面预览

### 智能数据中心 - 问数模式
支持自然语言查询，返回柱状图、饼图等可视化结果。

### 映射工作台 - 数据源树
左侧数据源树按 MySQL/Oracle/PostgreSQL 分组，可展开查看表列表，选中后右侧显示字段映射。

### 侧边栏收缩
点击底部箭头按钮可收缩侧边栏，仅显示图标，节省屏幕空间。

## 📝 更新日志

### v1.0.0 (2026-01-08)

- ✅ 新增智能数据中心，整合统一元数据和问数功能
- ✅ 实现找数模式：智能搜索、类型筛选、资产详情
- ✅ 实现问数模式：自然语言对话、柱状图/饼图可视化
- ✅ 新增映射工作台数据源树，支持按数据库类型分组
- ✅ 侧边栏支持收缩/展开，优化空间利用

## 📄 License

MIT License
