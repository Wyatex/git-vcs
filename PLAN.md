# Git VCS Desktop Tool — 需求实施计划

## 项目背景

基于 Electron + Vue 3 + TypeScript + UnoCSS 的 Git 可视化操作桌面工具，功能接近 WebStorm 内置 Git 管理工具。支持提交、分支、标签、搁置（stash）、合并、地铁图展示等基础内容。以 Monaco 作为文件编辑工具和三向合并的基础。

## 现状分析

### 已具备

| 层级 | 现状 |
|---|---|
| **基础栈** | Electron + electron-vite + Vue 3 + TypeScript + UnoCSS + Naive UI + Monaco + simple-git |
| **Preload** | API 暴露骨架已有，类型尚未完善 |
| **主题** | Naive UI + UnoCSS + 明暗主题系统 |
| **类型定义** | git.ts 有部分类型，但还不完整 |

### 缺失或不完整

1. **渲染层基本未落地** — 路由为空、app-layout 为占位、没有任何真实 Git 管理界面
2. **Stash 全流程** — 后端 IPC 未实现
3. **git:log 数据解析有问题** — 父子关系、refs、branch/tag labels 解析不可靠，无法支撑地铁图
4. **标签接口不完整** — annotated tag、标签元数据（commit、message、date）均未实现
5. **提交索引操作不完整** — 缺少 unstage、discard、staged diff
6. **分支接口不完整** — 缺少重命名、远程分支处理、merge 前检查
7. **三向合并不完整** — 后端原型存在但不稳定（临时文件策略需重构），前端 UI 完全缺失
8. **应用骨架缺失** — 缺少仓库上下文管理、页面路由结构、整体布局
9. **错误处理和用户反馈体系缺失**
10. **Preload 类型** — `window.api: unknown`，渲染层无类型安全

---

## 目标范围

本轮按"接近 WebStorm 内置 Git 工具"的第一版桌面客户端，覆盖：

1. 仓库选择与最近仓库
2. 提交工作台（staged/unstaged 双区）
3. 分支管理（创建、切换、删除、重命名、合并）
4. 标签管理（lightweight / annotated tag）
5. Stash 管理（创建、apply、pop、drop、show）
6. 提交历史与地铁图可视化
7. Merge 工作台 + Monaco 三向合并编辑器
8. Monaco 驱动的文件查看、diff、提交详情

---

## 实施计划

### 第一阶段：应用骨架与仓库上下文

- [ ] 1. 统一应用骨架与仓库上下文
  - 建立页面级布局：顶部仓库栏、左侧导航、中间主工作区、右侧详情面板或底部面板
  - 新增仓库上下文状态层（Pinia store），统一管理 `repoPath`、当前分支、仓库状态、最近仓库列表、加载状态
  - 规划路由页：
    - `overview` — 仓库总览
    - `commit` — 提交工作台
    - `branches` — 分支管理
    - `tags` — 标签管理
    - `stash` — Stash 管理
    - `history` — 提交历史与地铁图
    - `merge` — Merge 工作台
  - 将当前空的 `router/index.ts` 与 `app-layout.vue` 替换为真实工作台结构

### 第二阶段：补齐主进程 Git 能力接口

- [ ] 2. 补齐主进程 Git 能力接口
  - [ ] 2.1 完善仓库基础信息接口
    - 增加仓库合法性校验（是否为 git 仓库）
    - 增加当前 HEAD 信息读取（当前分支或 detached HEAD）
    - 增加远程信息（remotes）、merge 进行中状态、stash 数量等聚合接口
  - [ ] 2.2 完善提交与索引操作接口
    - 增加 `unstage`（`git reset HEAD -- <files>`）、`discard file`（`git checkout -- <file>`）
    - 增加 staged diff / unstaged diff 获取接口（`git diff --cached` / `git diff`）
    - 增加提交前校验：空提交消息、无 staged 文件、merge 进行中状态冲突
  - [ ] 2.3 完善分支操作接口
    - 增加 `checkout -b`（基于指定起点创建分支并切换）、重命名分支（`git branch -m`）
    - 增加 merge 目标预检查（能否 fast-forward、是否有冲突预判）
    - 增加本地/远程分支分组数据结构，便于前端树形展示
  - [ ] 2.4 完善标签操作接口
    - 增加 annotated tag 创建（`git tag -a` + message）
    - 增加标签指向提交、标签说明（annotation）、创建时间读取
  - [ ] 2.5 实现 stash 全流程接口
    - 增加 `stash list` — 获取 stash 列表（含 stash@{n} 索引、message、关联分支、时间）
    - 增加 `stash push` — 创建 stash（含 message、含未跟踪文件选项 `-u`）
    - 增加 `stash apply` — 应用 stash（可指定索引）
    - 增加 `stash pop` — 应用并删除
    - 增加 `stash drop` — 删除 stash
    - 增加 `stash show` — 获取 stash 的文件变更内容
  - [ ] 2.6 重构日志与提交图谱数据接口
    - 修正当前 `git:log` 的提交解析方式，输出可靠的：
      - `hash / authorName / authorEmail / date / message / body`
      - `parents` — 父提交 hash 数组
      - `refs` — 指向该提交的 branch/tag/stash 引用
      - `isMergeCommit` — 是否为合并提交
    - 输出适合前端绘制地铁图的数据结构（x/y 坐标、颜色、所属 lane 初始均为 0）
  - [ ] 2.7 完善 merge 与冲突解决接口
    - 增加 merge 前检查（是否允许 merge、是否为 already-up-to-date）
    - 增加冲突文件完整状态查询
    - 增加将编辑结果写回工作区并重新 stage 的接口
    - 提供单文件解决完成状态与整体 merge 完成条件

### 第三阶段：前端领域模型与 API 封装

- [ ] 3. 建立前端领域模型与 API 封装
  - 在 `src/renderer/src/` 下补齐以下目录结构：
    - `services/` — preload API 强类型封装层
    - `stores/` — Pinia 状态管理（仓库上下文、UI 状态）
    - `composables/` — 复用逻辑（Git 操作、刷新策略）
    - `views/` — 页面级组件
    - `components/git/` — Git 专属业务组件
  - 为 preload API 建立强类型封装，替换当前 `window.api: unknown`
  - 统一错误处理、消息提示（Naive UI `useMessage`）、异步加载与刷新策略
  - 补充完善类型：`RepositorySummary`、`StashEntry`、`ConflictResolutionState`、`GraphCommit`

### 第四阶段：仓库入口与总览页

- [ ] 4. 实现仓库入口与总览页
  - [ ] 4.1 实现仓库选择与最近仓库列表
    - 首页支持"打开仓库"（调用 preload `selectDirectory`）和"最近仓库"列表
    - 打开成功后自动保存最近记录、写入 store、加载仓库状态并跳转到总览页
  - [ ] 4.2 实现仓库总览信息卡
    - 展示当前分支、ahead/behind 数量、改动文件统计、stash 数量、冲突状态
    - 提供跳转入口到提交、历史、分支、合并页面

### 第五阶段：提交工作台

- [ ] 5. 实现提交工作台
  - [ ] 5.1 实现文件状态列表
    - 拆分 `staged / unstaged / conflicted / untracked` 四个分组
    - 单文件 stage、unstage、stage all、unstage all 操作
  - [ ] 5.2 实现提交编辑区
    - 提交标题（必填）+ 正文（可选）
    - 提交前校验结果展示与操作反馈
  - [ ] 5.3 实现文件 diff 预览
    - 选中文件后展示 Monaco DiffViewer（双列，ours/theirs）
    - 支持查看工作区 vs 索引、索引 vs HEAD 的差异
  - [ ]* 5.4 为提交状态流转编写单元测试
    - 覆盖 staged/unstaged 映射与提交前校验逻辑

### 第六阶段：分支管理

- [ ] 6. 实现分支管理页
  - [ ] 6.1 构建分支列表与分组展示
    - 区分本地分支、远程分支、当前分支高亮
    - 展示 ahead/behind、最新提交摘要、提交时间
  - [ ] 6.2 实现分支操作
    - 支持 checkout、基于指定起点创建分支、删除（force 可选）、重命名
    - 支持从分支页发起 merge 到当前分支
  - [ ] 6.3 增加分支详情面板
    - 展示分支指向提交、关联远程、提交摘要，支持跳转提交详情

### 第七阶段：标签管理

- [ ] 7. 实现标签管理页
  - [ ] 7.1 展示标签列表
    - 展示标签名、目标提交（hash 前 7 位）、创建时间、说明（annotation）
  - [ ] 7.2 实现标签操作
    - 支持 lightweight tag 创建、annotated tag 创建（含 message）
    - 支持删除标签、支持跳转到对应提交

### 第八阶段：Stash 管理

- [ ] 8. 实现 stash 管理页
  - [ ] 8.1 展示 stash 列表
    - 展示序号（stash@{n}）、消息、创建时间、关联分支
  - [ ] 8.2 实现 stash 操作
    - 支持创建 stash（含 message、含未跟踪文件选项）
    - 支持 apply（保留 stash）、pop（应用并删除）、drop（删除）
    - 支持查看 stash diff 详情
  - [ ]* 8.3 为 stash 数据映射编写单元测试
    - 覆盖 stash 解析与列表排序逻辑

### 第九阶段：提交历史与地铁图

- [ ] 9. 实现提交历史与地铁图页
  - [ ] 9.1 构建提交列表与详情面板
    - 展示提交作者、时间、refs（branch/tag 徽标）、parents、文件列表
    - 支持点击查看文件内容和变更
  - [ ] 9.2 实现地铁图渲染
    - 基于提交父子关系计算 lane/slot 分配
    - 绘制节点（commit dot）、连线（edge）、分支颜色、refs 徽标
    - 支持 merge commit 多父节点展示
  - [ ] 9.3 历史与详情联动
    - 点击图节点同步详情面板
    - 支持右键/按钮跳转到分支、标签、提交详情
  - [ ]* 9.4 为图谱布局算法编写单元测试
    - 覆盖线位分配、merge commit 渲染、refs 展示

### 第十阶段：Merge 工作台与三向合并

- [ ] 10. 实现 Merge 工作台与三向合并界面
  - [ ] 10.1 实现 merge 发起流程
    - 从分支页或独立 merge 页选择目标分支并执行 merge
    - 成功合并进入成功结果页；冲突进入冲突解决工作台
  - [ ] 10.2 实现冲突文件列表
    - 展示冲突文件、解决状态（resolved/unresolved）、是否已 stage
    - 支持逐个打开冲突文件进入编辑器
  - [ ] 10.3 实现 Monaco 三向合并编辑器
    - 方案采用"双列 diff + 可编辑结果区"模式：
      - 左侧 `OURS (本地)`
      - 右侧 `THEIRS (合并来源)`
      - 下方可编辑结果区（初始预填充 `git merge-file` 计算结果）
    - 冲突块级别高亮（ours/theirs/common 三色区分）与导航（上一个/下一个冲突）
    - 提供工具栏操作："接受 ours"、"接受 theirs"、"撤销"
    - 冲突块级别的手动编辑支持
  - [ ] 10.4 实现合并结果保存与完成流程
    - 将解决后的内容写回工作区文件（覆盖 conflicted 文件）
    - 自动 stage resolved file（`git add <file>`）
    - 所有冲突文件均 resolved 后，允许完成 merge commit
    - 支持 abort merge（回滚 merge 操作）
  - [ ]* 10.5 为冲突块解析和解决状态编写单元测试
    - 覆盖纯公共块、单冲突、多冲突、空文件、二进制文件保护策略

### 第十一阶段：统一 Monaco 编辑能力

- [ ] 11. 统一 Monaco 编辑能力
  - 提炼通用组件：
    - `MonacoEditor` — 基础编辑器（只读/可写）
    - `MonacoDiffEditor` — 双列 diff（用于提交 diff、stash diff）
    - `ThreeWayMergeEditor` — 三向合并编辑器
  - 统一配置：Naive UI 明暗主题同步、只读模式、语言推断（按文件后缀）、滚动同步、最小化缩略图

### 第十二阶段：交互细节与桌面体验

- [ ] 12. 完善交互细节与桌面体验
  - 加载骨架屏（Naive UI Skeleton）、空状态页面、错误提示（Naive UI Message / Notification）
  - 危险操作二次确认（删除分支、drop stash、abort merge）
  - 刷新按钮和自动刷新策略（staged 变化时局部刷新）
  - 窗口尺寸自适应、路径过长省略展示（tooltip 展示完整路径）
  - 键盘快捷键基础支持：`Ctrl+S` 保存编辑、`Ctrl+Enter` 提交
  - 保持现有 Naive UI + UnoCSS 风格统一

### 第十三阶段：检查点

- [ ] 13. 检查点 — 确保基础流程闭环
  - 完整流程验证：
    1. 打开仓库 → 查看状态
    2. stage 文件 → 提交
    3. 查看历史 → 查看地铁图
    4. 创建分支 → 切换分支 → 合并分支
    5. 创建标签 → 删除标签
    6. 创建 stash → apply stash → pop stash → drop stash
    7. 制造冲突 → 解决冲突 → 完成 merge

### 第十四阶段：工程质量收口

- [ ] 14. 工程质量收口
  - 修正 `preload/index.d.ts` 声明与渲染层调用方式，替换 `unknown` 为完整类型
  - 清理明显的占位代码（app-layout 里的 `todo`）和不可靠解析逻辑（git:log）
  - 补充关键代码注释：merge 三向合并算法、地铁图 lane 分配算法
  - 运行 `npm run typecheck` 和 `npm run lint`，修复所有阻断性问题

---

## 执行顺序

```
第一阶段 (1)  →  第二阶段 (2)  →  第三阶段 (3)  →  第四阶段 (4)
        ↓                                                    ↓
  第五阶段 (5)  →  第六阶段 (6)  →  第七阶段 (7)  →  第八阶段 (8)
        ↓
  第九阶段 (9)  →  第十阶段 (10)  →  第十一阶段 (11)  →  第十二阶段 (12)
        ↓
  第十三阶段 (13)  →  第十四阶段 (14)
```

**分阶段提交**：每个阶段完成后可单独 commit，形成清晰的 git 历史。

---

## 高风险点

| # | 风险描述 | 缓解措施 |
|---|---|---|
| 1 | 当前 `git:log` 解析逻辑不可靠，地铁图无法正确渲染 | 第二阶段优先重构日志解析，确保 parents/refs 数据正确 |
| 2 | `preload` 暴露名混用（electronAPI / api） | 第三阶段统一类型声明，渲染层只通过 `window.api` 强类型调用 |
| 3 | Monaco 三向合并没有现成完整组件 | 采用"双列 diff + 可编辑结果区"稳妥方案，避免自研复杂 diff 算法 |
| 4 | 地铁图 lane 分配算法复杂度较高 | 先实现基本 DAG 布局算法，merge commit 多父节点展示分步迭代 |

---

## 参考：WebStorm 内置 Git 工具功能对照

| 功能 | 状态 | 说明 |
|---|---|---|
| Commit 提交 | 部分实现 | 完全缺失 |
| Branches 分支 | 部分实现 | 完全缺失 |
| Tags 标签 | 部分实现 | 完全缺失 |
| Stash 搁置 | 未实现 | 完全缺失 |
| Merge / Rebase | 部分实现 | 完全缺失 |
| 三向合并 | 部分实现 | 完全缺失 |
| 提交历史 Log | 部分实现 | 完全缺失 |
| 地铁图 Visualization | 未实现 | 完全缺失 |
| 文件 diff | 未实现 | 完全缺失 |
| 仓库总览 Overview | 未实现 | 完全缺失 |
| 最近仓库 Recent | 有基础 | 完全缺失 |
