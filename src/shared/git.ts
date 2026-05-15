export interface RecentRepository {
  path: string
  name: string
  lastOpened: number
}

export interface FileChangeStats {
  staged: number
  unstaged: number
  untracked: number
  conflicted: number
}

export interface RepositoryStatus {
  currentBranch: string | null
  detached: boolean
  ahead: number
  behind: number
  mergeInProgress: boolean
  stashCount: number
  conflicts: string[]
  stagedFiles: string[]
  unstagedFiles: string[]
  untrackedFiles: string[]
}

export interface RepositorySummary {
  repoPath: string
  repoName: string
  isGitRepository: boolean
  currentBranch: string | null
  detached: boolean
  ahead: number
  behind: number
  mergeInProgress: boolean
  stashCount: number
  conflicts: string[]
  fileStats: FileChangeStats
  stagedFiles: string[]
  unstagedFiles: string[]
  untrackedFiles: string[]
  remotes: string[]
}

export interface BranchSummary {
  name: string
  current: boolean
  remote: boolean
  commit: string
  label: string
}

export interface TagSummary {
  name: string
  hash: string
}

export interface CommitSummary {
  hash: string
  shortHash: string
  authorName: string
  authorEmail: string
  date: string
  message: string
}

export interface CommitDetail extends CommitSummary {
  body: string
  parents: string[]
  files: string[]
}

export interface GitOperationResult {
  success: boolean
}

export interface CommitResult extends GitOperationResult {
  hash: string
}

export interface MergeResult extends GitOperationResult {
  status: 'success' | 'conflicted' | 'noop'
  conflicts: string[]
  message: string
}

export interface ConflictContent {
  content: string | null
}

export interface ElectronApi {
  selectDirectory: () => Promise<string | null>
  getRecentDirectories: () => Promise<RecentRepository[]>
  saveRecentDirectory: (path: string) => Promise<RecentRepository[]>
  removeRecentDirectory: (path: string) => Promise<RecentRepository[]>
  validateRepository: (repoPath: string) => Promise<boolean>
  getRepositorySummary: (repoPath: string) => Promise<RepositorySummary>
  getStatus: (repoPath: string) => Promise<RepositoryStatus>
  getBranches: (repoPath: string) => Promise<BranchSummary[]>
  getTags: (repoPath: string) => Promise<TagSummary[]>
  getLog: (repoPath: string, maxCount?: number) => Promise<CommitSummary[]>
  getCommitDetail: (repoPath: string, hash: string) => Promise<CommitDetail>
  getFileDiff: (repoPath: string, hash: string, filePath: string) => Promise<string>
  checkout: (repoPath: string, ref: string) => Promise<GitOperationResult>
  createBranch: (repoPath: string, name: string, startPoint?: string) => Promise<GitOperationResult>
  deleteBranch: (repoPath: string, name: string, force?: boolean) => Promise<GitOperationResult>
  createTag: (repoPath: string, name: string, message?: string) => Promise<GitOperationResult>
  deleteTag: (repoPath: string, name: string) => Promise<GitOperationResult>
  commit: (repoPath: string, message: string) => Promise<CommitResult>
  add: (repoPath: string, files: string[]) => Promise<GitOperationResult>
  stageAll: (repoPath: string) => Promise<GitOperationResult>
  getFileContent: (repoPath: string, hash: string, filePath: string) => Promise<string | null>
  getWorkingFileContent: (repoPath: string, filePath: string) => Promise<string | null>
  getUncommittedFileContent: (repoPath: string, filePath: string) => Promise<string | null>
  merge: (repoPath: string, branch: string) => Promise<MergeResult>
  getConflictContent: (repoPath: string, filePath: string) => Promise<ConflictContent>
  stageResolved: (repoPath: string, filePath: string) => Promise<GitOperationResult>
  completeMerge: (repoPath: string, message: string) => Promise<GitOperationResult>
  abortMerge: (repoPath: string) => Promise<GitOperationResult>
  unstage: (repoPath: string, files: string[]) => Promise<GitOperationResult>
  stagePartialContent: (repoPath: string, filePath: string, content: string) => Promise<GitOperationResult>
}
