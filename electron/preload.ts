import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // 目录
  selectDirectory: () => ipcRenderer.invoke('directory:select'),
  getRecentDirectories: () => ipcRenderer.invoke('directory:get-recent'),
  saveRecentDirectory: (path: string) => ipcRenderer.invoke('directory:save-recent', path),
  removeRecentDirectory: (path: string) => ipcRenderer.invoke('directory:remove-recent', path),

  // Git 基础
  getStatus: (repoPath: string) => ipcRenderer.invoke('git:status', repoPath),
  getBranches: (repoPath: string) => ipcRenderer.invoke('git:branches', repoPath),
  getTags: (repoPath: string) => ipcRenderer.invoke('git:tags', repoPath),
  getLog: (repoPath: string, maxCount?: number) => ipcRenderer.invoke('git:log', repoPath, maxCount),
  getCommitDetail: (repoPath: string, hash: string) => ipcRenderer.invoke('git:commit-detail', repoPath, hash),
  getFileDiff: (repoPath: string, hash: string, filePath: string) => ipcRenderer.invoke('git:file-diff', repoPath, hash, filePath),

  // Git 操作
  checkout: (repoPath: string, ref: string) => ipcRenderer.invoke('git:checkout', repoPath, ref),
  createBranch: (repoPath: string, name: string, startPoint?: string) => ipcRenderer.invoke('git:create-branch', repoPath, name, startPoint),
  deleteBranch: (repoPath: string, name: string, force?: boolean) => ipcRenderer.invoke('git:delete-branch', repoPath, name, force),
  createTag: (repoPath: string, name: string, message?: string) => ipcRenderer.invoke('git:create-tag', repoPath, name, message),
  deleteTag: (repoPath: string, name: string) => ipcRenderer.invoke('git:delete-tag', repoPath, name),
  commit: (repoPath: string, message: string) => ipcRenderer.invoke('git:commit', repoPath, message),
  add: (repoPath: string, files: string[]) => ipcRenderer.invoke('git:add', repoPath, files),
  stageAll: (repoPath: string) => ipcRenderer.invoke('git:stage-all', repoPath),

  // 文件内容
  getFileContent: (repoPath: string, hash: string, filePath: string) => ipcRenderer.invoke('git:file-content', repoPath, hash, filePath),
  getWorkingFileContent: (repoPath: string, filePath: string) => ipcRenderer.invoke('git:working-file-content', repoPath, filePath),
  getUncommittedFileContent: (repoPath: string, filePath: string) => ipcRenderer.invoke('git:uncommitted-file-content', repoPath, filePath),

  // 合并
  merge: (repoPath: string, branch: string) => ipcRenderer.invoke('merge:start', repoPath, branch),
  getConflictContent: (repoPath: string, filePath: string) => ipcRenderer.invoke('merge:get-conflict-content', repoPath, filePath),
  stageResolved: (repoPath: string, filePath: string) => ipcRenderer.invoke('merge:stage-resolved', repoPath, filePath),
  completeMerge: (repoPath: string, message: string) => ipcRenderer.invoke('merge:complete', repoPath, message),
  abortMerge: (repoPath: string) => ipcRenderer.invoke('merge:abort', repoPath)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
