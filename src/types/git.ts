// ===== Commit 提交记录 =====
export interface Commit {
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

// ===== Branch 分支信息 =====
export interface BranchInfo {
  name: string
  isCurrent: boolean
  isRemote: boolean
  commitHash: string
  label?: string
  behind: number
  ahead: number
}

// ===== Tag 标签信息 =====
export interface TagInfo {
  name: string
  commitHash: string
  message?: string
  isAnnotated?: boolean
  date?: string
}

// ===== Directory 目录历史 =====
export interface DirectoryEntry {
  path: string
  name: string
  lastOpened: number
}

// ===== Status 仓库状态 =====
export interface FileChange {
  path: string
  working_dir: string
  index: string
  staged: boolean
}

export interface StatusResult {
  current: string
  tracking: string | null
  files: FileChange[]
  ahead: number
  behind: number
  conflicted: string[]
}

// ===== Metro 地铁图节点 =====
export interface MetroNode {
  commit: Commit
  x: number
  y: number
  color: string
  level: number
  branchSlot: number
  isHead?: boolean
  isMergeCommit?: boolean
}

export interface MetroEdge {
  from: MetroNode
  to: MetroNode
  color: string
}

// ===== Merge 合并冲突 =====
export interface MergeChunk {
  type: 'common' | 'conflict'
  lines: string[]
  oursLines: string[]
  theirsLines: string[]
}

export interface ConflictFile {
  filePath: string
  base: string
  ours: string
  theirs: string
  workingContent: string | null
  resolved: string
  chunks: MergeChunk[]
  status: 'unresolved' | 'resolved'
  error?: string
}

export interface MergeResult {
  success: boolean
  hasConflicts?: boolean
  conflicts?: string[]
  merged?: string[]
  failed?: boolean
  error?: string
}

// ===== Commit Detail 提交详情 =====
export interface CommitDetail extends Commit {
  files: string[]
}

// ===== Diff 差异 =====
export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumberLeft: number
  lineNumberRight: number
}
