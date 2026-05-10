/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ElectronAPI {
  // 目录
  selectDirectory: () => Promise<string | null>
  getRecentDirectories: () => Promise<Array<{ path: string; name: string; lastOpened: number }>>
  saveRecentDirectory: (path: string) => Promise<Array<{ path: string; name: string; lastOpened: number }>>
  removeRecentDirectory: (path: string) => Promise<Array<{ path: string; name: string; lastOpened: number }>>

  // Git 基础
  getStatus: (repoPath: string) => Promise<any>
  getBranches: (repoPath: string) => Promise<any[]>
  getTags: (repoPath: string) => Promise<any[]>
  getLog: (repoPath: string, maxCount?: number) => Promise<any[]>
  getCommitDetail: (repoPath: string, hash: string) => Promise<any>
  getFileDiff: (repoPath: string, hash: string, filePath: string) => Promise<string>

  // Git 操作
  checkout: (repoPath: string, ref: string) => Promise<{ success: boolean }>
  createBranch: (repoPath: string, name: string, startPoint?: string) => Promise<{ success: boolean }>
  deleteBranch: (repoPath: string, name: string, force?: boolean) => Promise<{ success: boolean }>
  createTag: (repoPath: string, name: string, message?: string) => Promise<{ success: boolean }>
  deleteTag: (repoPath: string, name: string) => Promise<{ success: boolean }>
  commit: (repoPath: string, message: string) => Promise<{ success: boolean; hash: string }>
  add: (repoPath: string, files: string[]) => Promise<{ success: boolean }>
  stageAll: (repoPath: string) => Promise<{ success: boolean }>

  // 文件内容
  getFileContent: (repoPath: string, hash: string, filePath: string) => Promise<string | null>
  getWorkingFileContent: (repoPath: string, filePath: string) => Promise<string | null>
  getUncommittedFileContent: (repoPath: string, filePath: string) => Promise<string | null>

  // 合并
  merge: (repoPath: string, branch: string) => Promise<any>
  getConflictContent: (repoPath: string, filePath: string) => Promise<any>
  stageResolved: (repoPath: string, filePath: string) => Promise<{ success: boolean }>
  completeMerge: (repoPath: string, message: string) => Promise<{ success: boolean }>
  abortMerge: (repoPath: string) => Promise<{ success: boolean }>
}

interface Window {
  electronAPI: ElectronAPI
}
