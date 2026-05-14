# Todo 客户端技术选型

## 1. 总体方案

**Tauri v2 + React + TypeScript + Vite**

对应需求文档中的方案 A，体积小、性能好、内存低，原生体验优于 Electron。

## 2. 技术栈明细

### 2.1 桌面运行时：Tauri v2

| 评估维度 | 说明 |
|----------|------|
| 版本 | Tauri v2 (Stable) |
| 后端语言 | Rust |
| 跨平台 | Windows 10+ / macOS 12+ |
| 体积 | ~5MB 安装包（系统 WebView，不含 Chromium） |
| 内存 | 远低于 Electron（无独立浏览器进程） |
| 生态 | 官方插件体系完善，社区快速增长 |

**选型理由**：
- 使用系统原生 WebView（macOS WebKit / Windows WebView2），不捆绑 Chromium，安装包 ~5MB
- Rust 后端性能优异，内存占用低
- 前端技术栈完全复用（React/TypeScript 不变）
- Vite 原生集成（`@tauri-apps/cli` 内置 Vite 支持）
- 安全模型先进（CSP 强制、权限白名单、最小化 API 暴露）
- 后续无需"迁移至 Tauri"，一次到位

### 2.2 UI 框架：React 18

- 函数组件 + Hooks，开发效率高
- 生态最大，UI 库选择多
- Tauri 的 WebView 对 React 支持完善

### 2.3 构建工具：Vite

- 开发服务器秒启，HMR 极快
- Tauri 官方推荐 Vite 作为前端构建工具
- `create-tauri-app` 脚手架直接支持 React + Vite 模板

### 2.4 语言：TypeScript + Rust

- **前端**：TypeScript (strict)，类型安全，IDE 智能提示
- **后端**：Rust，Tauri 核心语言，负责窗口管理、系统调用、IPC

### 2.5 状态管理：Zustand

- 极简 API，无 boilerplate
- 支持 persist 中间件（localStorage 开箱即用）
- 体积 < 1KB
- 适合中小型应用（对比 Redux 过重，Jotai 偏向原子化）

### 2.6 UI 组件库：Ant Design 5

- 中文优先，企业级组件
- 表格、表单、日历等业务组件齐全
- 主题定制灵活

### 2.7 本地存储：tauri-plugin-sql (SQLite)

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| localStorage / IndexedDB | 简单 | 大量任务时性能差、无 SQL 查询 | ❌ |
| tauri-plugin-sql | 官方插件、SQLite 完整支持、前端直接调用 | - | ✅ |
| 自定义 Rust + rusqlite | 灵活、性能最优 | 需手写 IPC 桥接 | 备选 |

**选型理由**：关系型数据天然适合任务管理（清单、标签、任务之间多对多），`tauri-plugin-sql` 提供前端 JS API 直接操作 SQLite，无需手写 Rust 命令。

### 2.8 测试

| 类型 | 工具 |
|------|------|
| 前端单元测试 | Vitest |
| 前端组件测试 | React Testing Library |
| Rust 单元测试 | cargo test |
| E2E | Playwright (WebView) |

### 2.9 代码质量

- ESLint (flat config) + Prettier（前端）
- rustfmt + clippy（后端）
- Husky + lint-staged (pre-commit)
- Commitlint (conventional commits)

### 2.10 打包分发

- Tauri 内置打包（`tauri build`）
- 自动更新：tauri-plugin-updater
- Windows：`.msi` / `.exe` (NSIS)
- macOS：`.dmg` / `.app`

## 3. 架构概要

```
todo-list/
├── src/                  # React 渲染进程
│   ├── components/       # UI 组件
│   ├── stores/           # Zustand stores
│   ├── hooks/            # 自定义 hooks
│   ├── db/               # 数据库操作（tauri-plugin-sql）
│   └── i18n/             # 国际化
├── src-tauri/            # Tauri 后端 (Rust)
│   ├── src/
│   │   └── main.rs       # 入口、插件注册
│   ├── Cargo.toml        # Rust 依赖
│   └── tauri.conf.json   # Tauri 配置（窗口、权限、打包）
├── public/               # 静态资源
├── index.html            # HTML 入口
└── vite.config.ts        # Vite 配置
```

前端通过 `@tauri-apps/api` 的 `invoke()` 调用 Rust 命令，或通过 `tauri-plugin-sql` 前端 API 直接操作 SQLite。

## 4. 引入的依赖

```
# 前端核心
react, react-dom

# Tauri
@tauri-apps/api, @tauri-apps/cli
@tauri-apps/plugin-sql (SQLite)
@tauri-apps/plugin-updater (自动更新)
@tauri-apps/plugin-notification (系统通知)

# 构建
vite, @vitejs/plugin-react
typescript, @types/react

# UI
antd, @ant-design/icons

# 状态 & 数据
zustand

# 质量
eslint, prettier, vitest, @testing-library/react
```

```
# Rust 后端 (Cargo.toml)
[dependencies]
tauri = "2"
tauri-plugin-sql = "2"
tauri-plugin-updater = "2"
tauri-plugin-notification = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

## 5. 决策记录

| 决策 | 结论 | 日期 |
|------|------|------|
| 桌面运行时 | Electron → **Tauri v2** | 2026-05-14 |
| UI 框架 | React 18 | 2026-05-14 |
| 构建工具 | Vite | 2026-05-14 |
| 前端语言 | TypeScript (strict) | 2026-05-14 |
| 后端语言 | Rust | 2026-05-14 |
| 状态管理 | Zustand | 2026-05-14 |
| 组件库 | Ant Design 5 | 2026-05-14 |
| 本地存储 | tauri-plugin-sql (SQLite) | 2026-05-14 |
| 打包工具 | Tauri 内置 | 2026-05-14 |
