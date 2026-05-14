# Todo 客户端技术选型

## 1. 总体方案

**Electron + React + TypeScript + Vite**

对应需求文档中的方案 B，生态成熟、开发效率高、社区资源丰富。

## 2. 技术栈明细

### 2.1 桌面运行时：Electron

| 评估维度 | 说明 |
|----------|------|
| 版本 | Electron 28+ (Stable) |
| 跨平台 | Windows 10+ / macOS 12+ |
| 体积 | ~120MB 安装包，Acceptable |
| 内存 | 优化后 < 200MB，满足需求 |
| 生态 | npm 海量包，社区活跃 |

**选型理由**：
- 生态最成熟的跨平台桌面方案，VS Code、Slack、Notion 均采用
- React/TypeScript 开发者零门槛上手
- electron-builder 打包分发成熟
- 后续可渐进迁移至 Tauri（Web 层代码复用）

### 2.2 UI 框架：React 18

- 函数组件 + Hooks，开发效率高
- 生态最大，UI 库选择多
- 虚拟 DOM 性能足以应对千级任务量

### 2.3 构建工具：Vite

- 开发服务器秒启
- HMR 极快
- electron-vite 集成方案成熟

### 2.4 语言：TypeScript

- 类型安全，减少运行时错误
- IDE 智能提示，提升开发体验
- 全栈统一（Renderer + Main + Preload）

### 2.5 状态管理：Zustand

- 极简 API，无 boilerplate
- 支持 persist 中间件（本地持久化开箱即用）
- 体积 < 1KB
- 适合中小型应用（对比 Redux 过重，Jotai 偏向原子化）

### 2.6 UI 组件库：Ant Design 5

- 中文优先，企业级组件
- 表格、表单、日历等业务组件齐全
- 主题定制灵活

### 2.7 本地存储：better-sqlite3

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| electron-store (JSON) | 简单 | 大量任务时性能差 | ❌ |
| better-sqlite3 | 高性能、SQL查询 | 需原生编译 | ✅ |
| lowdb | 轻量 | 无索引查询能力 | ❌ |

**选型理由**：关系型数据天然适合任务管理（清单、标签、任务之间多对多），SQLite 支持复杂查询和索引。

### 2.8 测试

| 类型 | 工具 |
|------|------|
| 单元测试 | Vitest |
| 组件测试 | React Testing Library |
| E2E | Playwright + electron |

### 2.9 代码质量

- ESLint (flat config) + Prettier
- Husky + lint-staged (pre-commit)
- Commitlint (conventional commits)

### 2.10 打包分发

- electron-builder
- 自动更新：electron-updater
- 目标格式：Windows (NSIS/msi)、macOS (dmg)

## 3. 架构概要

```
todo-list/
├── electron/          # Electron 主进程
│   ├── main.ts        # 窗口管理、IPC
│   └── preload.ts     # 安全的 API 桥接
├── src/               # React 渲染进程
│   ├── components/    # UI 组件
│   ├── stores/        # Zustand stores
│   ├── hooks/         # 自定义 hooks
│   ├── db/            # 数据库操作层
│   └── i18n/          # 国际化
├── resources/         # 图标等静态资源
└── electron-builder.yml
```

## 4. 引入的依赖

```
# 核心
electron, react, react-dom

# 构建
vite, electron-vite, electron-builder
typescript, @types/react

# UI
antd, @ant-design/icons

# 状态 & 数据
zustand, better-sqlite3

# 质量
eslint, prettier, vitest, @testing-library/react
```

## 5. 决策记录

| 决策 | 结论 | 日期 |
|------|------|------|
| 桌面运行时 | Electron | 2026-05-14 |
| UI 框架 | React 18 | 2026-05-14 |
| 构建工具 | Vite (electron-vite) | 2026-05-14 |
| 语言 | TypeScript (strict) | 2026-05-14 |
| 状态管理 | Zustand | 2026-05-14 |
| 组件库 | Ant Design 5 | 2026-05-14 |
| 本地存储 | better-sqlite3 | 2026-05-14 |
| 打包工具 | electron-builder | 2026-05-14 |
