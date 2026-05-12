# Project Structure

## Overview

Electron + Vue 3 + TypeScript + UnoCSS 桌面应用，Git 可视化管理工具。使用 electron-vite 作为构建工具，将代码拆分为 main（主进程）、preload（预加载脚本）、renderer（渲染进程）三层。

---

## Directory Layout

```
/workspace
│
├── src/
│   ├── main/                         # Electron 主进程（Node.js）
│   │   ├── index.ts                  # 入口：窗口创建、IPC 注册、生命周期管理
│   │   └── ipc/                      # IPC 处理器（主进程 <-> 渲染进程通信）
│   │       └── index.ts              # 导出并注册所有 handler
│   │
│   ├── preload/                      # 预加载脚本（桥接主进程与渲染进程）
│   │   ├── index.ts                  # 入口：暴露 API 到 window 对象
│   │   └── index.d.ts                # 声明 window.electronAPI 类型（目前不完整）
│   │
│   └── renderer/                     # 渲染进程（Vue 3 前端）
│       ├── index.html                # HTML 入口
│       └── src/                      # 源代码（src/renderer/src/，别名 @）
│           ├── main.ts               # Vue 应用入口：Pinia + Router + UnoCSS
│           ├── App.vue                # 根组件：NConfigProvider + RouterView
│           │
│           ├── router/
│           │   └── index.ts          # Vue Router 配置（目前为空，未注册任何页面路由）
│           │
│           ├── components/            # 业务组件
│           │   ├── app-provider.vue  # Naive UI 全局上下文注入（Message/Dialog/Notification）
│           │   └── app-layout.vue    # 根布局组件（目前为占位）
│           │
│           ├── stores/                # Pinia 状态管理
│           │   └── theme/            # 主题状态（darkMode + Naive UI themeOverrides）
│           │       ├── index.ts
│           │       └── shared.ts
│           │
│           ├── types/                # TypeScript 类型声明
│           │   ├── app.d.ts          # 全局 App 命名空间（路由/主题/Naive UI）
│           │   ├── git.ts             # Git 领域类型（Commit/Branch/Tag/Merge/Metro...）
│           │   ├── common.d.ts        # 通用工具类型（Option/StrategicPattern/...）
│           │   ├── union-key.d.ts    # 联合类型别名（ThemeScheme/PageAnimateMode/...）
│           │   ├── storage.d.ts
│           │   ├── components.d.ts    # 自动生成：Vue 组件类型声明（unplugin-vue-components）
│           │   └── global.d.ts        # 全局声明扩展
│           │
│           ├── utils/                 # 工具函数
│           │   ├── color/            # 颜色工具（Naive UI / Ant Design / 推荐色板）
│           │   │   ├── constant/     # 常量色板（palette/name）
│           │   │   ├── palette/      # 预设调色板（antd/recommend）
│           │   │   ├── shared/       # 共享颜色处理（colord 包装）
│           │   │   └── types/        # 颜色类型定义
│           │   ├── common.ts
│           │   └── storage.ts        # 本地存储封装
│           │
│           ├── theme/                # 主题变量
│           │   ├── vars.ts           # UnoCSS CSS 变量定义
│           │   └── settings.ts       # 主题预设配置
│           │
│           └── style.css             # 全局样式
│
├── resources/                        # 构建资源
│   └── icon.png                     # 应用图标
│
├── build/                           # Electron Builder 平台特定资源
│   ├── icon.ico / icon.icns / icon.png
│   └── entitlements.mac.plist
│
├── electron.vite.config.ts           # electron-vite 构建配置（Vue 插件/UnoCSS/Naive UI Resolver/iconify）
├── electron-builder.yml              # Electron Builder 打包配置
├── uno.config.ts                     # UnoCSS 配置（presetWind3 + presetIcons + 自定义 shortcuts/theme）
├── tsconfig.json                     # 项目级 tsconfig（引用 node + web）
├── tsconfig.node.json                # 主进程/preload 类型配置（包含 main/**, preload/**, electron.vite.config.*）
├── tsconfig.web.json                 # 渲染进程类型配置（包含 @ 别名路径映射）
├── eslint.config.ts                  # ESLint 配置（@antfu/eslint-config）
└── package.json                      # 依赖管理（pnpm）
```

---

## Architecture

### 三进程模型

```
┌─────────────────────────────────────────────────────┐
│                   main (Node.js)                      │
│  · 窗口管理 · 文件系统 · 子进程 · IPC handlers        │
│  · simple-git · git merge-file                        │
└──────────────────────┬────────────────────────────────┘
                      │ IPC (invoke / on)
        ┌─────────────┴─────────────┐
        │       preload             │
        │  contextBridge.exposeIn    │
        │  MainWorld('electronAPI')  │
        └─────────────┬─────────────┘
                      │ window.electronAPI
        ┌─────────────┴─────────────┐
        │     renderer (Chromium)    │
        │  Vue 3 + Pinia + Router   │
        │  Naive UI + UnoCSS         │
        │  Monaco Editor             │
        └───────────────────────────┘
```

### 渲染进程别名

`@` 指向 `src/renderer/src/`，所有渲染进程内部导入均使用此别名。

### 状态管理（Pinia）

- `stores/theme/` — 明暗主题状态，持久化到 `localStorage`（`pinia-plugin-persistedstate`）
- 其他 store 尚未建立（仓库上下文等为 TODO）

### 组件自动导入

使用 `unplugin-vue-components` + `NaiveUiResolver` + `iconsResolver`，所有 Naive UI 组件和 `i-` 前缀的 iconify 图标无需手动 import，可直接用于模板。

---

## Key Dependencies

| 依赖 | 用途 |
|---|---|
| `electron-vite` | 主进程/preload/renderer 三合一构建 |
| `simple-git` | Git 操作（封装 libgit2 / git CLI） |
| `monaco-editor` + `@guolao/vue-monaco-editor` | 代码编辑器与 diff 视图 |
| `naive-ui` | UI 组件库 |
| `unocss` + `preset-wind3` | 原子化 CSS |
| `pinia` + `pinia-plugin-persistedstate` | 状态管理 |
| `vue-router` | 路由 |
| `@vueuse/core` | 组合式工具 |
| `diff-match-patch` | 文本差异计算 |
| `colord` | 颜色处理 |
| `defu` | 配置深度合并 |

---

## Build Scripts

```bash
pnpm dev          # 开发模式（electron-vite dev）
pnpm build        # 生产构建（typecheck + electron-vite build）
pnpm build:win    # 构建 Windows 安装包
pnpm build:mac    # 构建 macOS dmg
pnpm build:linux  # 构建 Linux AppImage/deb/snap
pnpm lint         # ESLint 检查
pnpm typecheck    # tsconfig.node + tsconfig.web 联合检查
```

---

## Known Issues

1. **异常嵌套目录** — 存在 `src/renderer/src/renderer/src/` 重复嵌套，`components.d.ts` 已在其中生成了一次，该目录不会参与构建但应手动清理。
2. **路由未注册** — `router/index.ts` 目前为空，暂无页面路由。
3. **preload 类型不完整** — `preload/index.d.ts` 未导出完整类型，`env.d.ts` 中 `ElectronAPI` 使用 `any`，渲染层缺少类型安全。
4. **git:log 解析不可靠** — 当前 `git:log` 使用的字段分割方式无法正确处理复杂提交信息。
5. **渲染层基本为空白** — 除了主题系统和 Naive UI provider 外，Git 管理界面完全未实现。

---

## AI Context

- 所有新建会话首次接触此项目时，**只需阅读本文件**，无需重新探索目录。
- `.monkeycode/MEMORY.md` 记录了用户偏好和项目知识，AI 会自动读取。
- `PLAN.md` 为完整的功能实施计划，记录了缺失能力与开发顺序。
