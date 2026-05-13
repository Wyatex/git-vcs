import type {
  BranchSummary,
  CommitDetail,
  CommitSummary,
  ConflictContent,
  GitOperationResult,
  MergeResult,
  RecentRepository,
  RepositoryStatus,
  RepositorySummary,
  TagSummary,
} from '../../../shared/git'

export type {
  BranchSummary,
  CommitDetail,
  CommitSummary,
  ConflictContent,
  GitOperationResult,
  MergeResult,
  RecentRepository,
  RepositoryStatus,
  RepositorySummary,
  TagSummary,
}

export interface StashEntry {
  name: string
  message: string
  branch?: string
  date?: string
}

export interface ConflictResolutionState {
  filePath: string
  resolved: boolean
  staged: boolean
}

export interface GraphCommit extends CommitSummary {
  parents?: string[]
  refs?: string[]
  lane?: number
  x?: number
  y?: number
}
