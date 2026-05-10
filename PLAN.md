# Git VCS Tool - 可视化 Git 管理工具

## 概述

基于 Electron + Vue 3 + TypeScript 的 Git 可视化操作桌面工具，功能接近 WebStorm 内置 Git 管理工具。

## 技术栈

| 层级              | 技术                              | 说明                     |
| ----------------- | --------------------------------- | ------------------------ |
| **Desktop Shell** | Electron 28+                      | 桌面壳，访问本地文件系统 |
| **构建工具**      | Vite + electron-vite              | 开发/构建                |
| **前端框架**      | Vue 3 + TypeScript                | UI 框架                  |
| **状态管理**      | Pinia                             | 状态管理                 |
| **路由**          | Vue Router 4                      | 页面路由                 |
| **Git 交互**      | simple-git                        | Git 操作封装             |
| **代码编辑器**    | Monaco Editor                     | 代码编辑和差异比对       |
| **差异算法**      | diff-match-patch + git merge-file | 三向合并行级差异         |
| **地铁图**        | HTML5 Canvas 自定义渲染           | DAG 提交图可视化         |

## 架构

```
┌──────────────────────────────────────────────────────────┐
│                    Renderer Process                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Directory │  │ MetroMap │  │  Branch/ │  │3-Way    │ │
│  │Selector  │  │(Canvas)  │  │  Tag Mgmt│  │Merge    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       └──────────────┴──────────────┴──────────────┘     │
│                        │ IPC (contextBridge)              │
├────────────────────────┼─────────────────────────────────┤
│                  Main Process                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Git IPC   │  │Directory │  │Merge IPC │  │Dialog   │ │
│  │Handlers  │  │IPC       │  │Handlers  │  │IPC      │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │             │             │              │      │
│  ┌────┴────┐   ┌────┴────┐   ┌────┴────┐        │      │
│  │simple-git│   │  fs     │   │git merge│        │      │
│  │         │   │         │   │ -file   │        │      │
│  └─────────┘   └─────────┘   └─────────┘        │      │
│                       + diff-match-patch         │      │
└──────────────────────────────────────────────────────────┘
```

## 目录结构

```
git-vcs-bun/
├── electron/
│   ├── main.ts                  # Electron 主进程入口
│   ├── preload.ts               # contextBridge IPC API
│   └── ipc/
│       ├── index.ts             # 注册所有 IPC 处理器
│       ├── git.ipc.ts           # Git 操作 IPC (simple-git)
│       ├── directory.ipc.ts     # 目录选择 & 最近目录
│       └── merge.ipc.ts         # 三向合并 IPC
├── src/
│   ├── main.ts                  # Vue 入口
│   ├── App.vue                  # 根组件
│   ├── style.css                # 全局样式
│   ├── env.d.ts                 # 类型声明
│   ├── router/
│   │   └── index.ts             # 路由配置
│   ├── stores/
│   │   ├── git.ts               # Git 状态
│   │   ├── directory.ts         # 目录历史状态
│   │   └── merge.ts             # 合并冲突状态
│   ├── types/
│   │   └── git.ts               # TS 类型定义
│   ├── views/
│   │   ├── HomeView.vue         # 首页：目录选择 + 历史
│   │   ├── DashboardView.vue    # 项目仪表盘
│   │   ├── HistoryView.vue      # 历史 + 地铁图
│   │   ├── BranchView.vue       # 分支管理
│   │   ├── TagView.vue          # 标签管理
│   │   └── MergeView.vue        # 三向合并
│   ├── components/
│   │   ├── DirectorySelector.vue# 目录选择器
│   │   ├── MetroMap.vue         # 地铁图 (Canvas)
│   │   ├── CommitDetail.vue     # 提交详情
│   │   ├── FileChangeTree.vue   # 文件变更树
│   │   ├── MonacoDiffEditor.vue # Monaco 差异对比
│   │   ├── ThreeWayMergeEditor.vue # 三向合并编辑器
│   │   ├── BranchList.vue       # 分支列表
│   │   └── TagList.vue          # 标签列表
│   └── utils/
│       ├── metro-map-layout.ts  # 地铁图 DAG 布局算法
│       └── merge-utils.ts       # 三向合并工具函数
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── electron.vite.config.ts
├── electron-builder.json
└── index.html
```

## 数据模型

### Commit

```typescript
interface Commit {
  hash: string
  authorName: string
  authorEmail: string
  date: string
  message: string
  body: string
  parents: string[]
  refs: string[]
  branches: string[]
  tags: string[]
}
```

### BranchInfo

```typescript
interface BranchInfo {
  name: string
  isCurrent: boolean
  isRemote: boolean
  commitHash: string
  upstream?: string
  behind: number
  ahead: number
}
```

### TagInfo

```typescript
interface TagInfo {
  name: string
  commitHash: string
  message?: string
  isAnnotated: boolean
  date?: string
}
```

### DirectoryEntry

```typescript
interface DirectoryEntry {
  path: string
  name: string
  lastOpened: number
}
```

### MetroNode (地铁图节点)

```typescript
interface MetroNode {
  commit: Commit
  x: number
  y: number
  color: string
  level: number
  branchSlot: number
}
```

### ConflictFile

```typescript
interface ConflictFile {
  filePath: string
  ours: string
  theirs: string
  base: string
  resolved: string
  status: 'unresolved' | 'resolved'
  encoding: string
}
```

## 页面设计

### 1. HomeView - 目录选择首页

- 目录选择器 + 最近打开仓库历史列表
- 初始化新仓库 / 克隆远程仓库

### 2. DashboardView - 项目仪表盘

- 文件变更树（Working tree changes）
- 暂存区管理
- 快速操作：拉取、推送、提交、合并

### 3. HistoryView - 地铁图 + 提交历史

- Canvas 渲染的 DAG 提交图
- 多分支彩色轨道展示
- 搜索/过滤提交
- 点击提交查看详情

### 4. MergeView - 三向合并

- 左侧：当前分支(Ours) 只读
- 中间：Monaco Editor 可编辑合并结果
- 右侧：目标分支(Theirs) 只读
- 底部：共同祖先(Base) 可折叠参考
- 逐块接受 Ours/Theirs
- 文件列表显示冲突状态

## 三向合并算法流程

1. 用户触发合并 → `git merge branch-name`
2. 检测到冲突 → 列出冲突文件
3. 对每个冲突文件：
   a. `git show :1:path` → BASE
   b. `git show :2:path` → OURS
   c. `git show :3:path` → THEIRS
   d. `git merge-file` 计算行级差异
   e. 显示在 ThreeWayMergeEditor
4. 用户编辑解决 → `git add path`
5. 全部解决 → `git commit` 完成

## 实现阶段

| 阶段        | 内容               | 文件数 |
| ----------- | ------------------ | ------ |
| **Phase 1** | 项目脚手架搭建     | 10     |
| **Phase 2** | 目录选择和历史记录 | 4      |
| **Phase 3** | 基础 Git 操作      | 6      |
| **Phase 4** | 地铁图可视化       | 4      |
| **Phase 5** | 分支管理           | 3      |
| **Phase 6** | 标签管理           | 3      |
| **Phase 7** | 三向合并编辑器     | 5      |
| **Phase 8** | 样式打磨和优化     | 3      |
