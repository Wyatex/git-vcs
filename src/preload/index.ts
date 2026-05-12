import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ElectronApi } from '../shared/git'

// Custom APIs for renderer
const api: ElectronApi = {
  selectDirectory: () => ipcRenderer.invoke('selectDirectory'),
  getRecentDirectories: () => ipcRenderer.invoke('getRecentDirectories'),
  saveRecentDirectory: path => ipcRenderer.invoke('saveRecentDirectory', path),
  removeRecentDirectory: path => ipcRenderer.invoke('removeRecentDirectory', path),
  validateRepository: repoPath => ipcRenderer.invoke('validateRepository', repoPath),
  getRepositorySummary: repoPath => ipcRenderer.invoke('getRepositorySummary', repoPath),
  getStatus: repoPath => ipcRenderer.invoke('getStatus', repoPath),
  getBranches: repoPath => ipcRenderer.invoke('getBranches', repoPath),
  getTags: repoPath => ipcRenderer.invoke('getTags', repoPath),
  getLog: (repoPath, maxCount) => ipcRenderer.invoke('getLog', repoPath, maxCount),
  getCommitDetail: (repoPath, hash) => ipcRenderer.invoke('getCommitDetail', repoPath, hash),
  getFileDiff: (repoPath, hash, filePath) => ipcRenderer.invoke('getFileDiff', repoPath, hash, filePath),
  checkout: (repoPath, ref) => ipcRenderer.invoke('checkout', repoPath, ref),
  createBranch: (repoPath, name, startPoint) => ipcRenderer.invoke('createBranch', repoPath, name, startPoint),
  deleteBranch: (repoPath, name, force) => ipcRenderer.invoke('deleteBranch', repoPath, name, force),
  createTag: (repoPath, name, message) => ipcRenderer.invoke('createTag', repoPath, name, message),
  deleteTag: (repoPath, name) => ipcRenderer.invoke('deleteTag', repoPath, name),
  commit: (repoPath, message) => ipcRenderer.invoke('commit', repoPath, message),
  add: (repoPath, files) => ipcRenderer.invoke('add', repoPath, files),
  stageAll: repoPath => ipcRenderer.invoke('stageAll', repoPath),
  getFileContent: (repoPath, hash, filePath) => ipcRenderer.invoke('getFileContent', repoPath, hash, filePath),
  getWorkingFileContent: (repoPath, filePath) => ipcRenderer.invoke('getWorkingFileContent', repoPath, filePath),
  getUncommittedFileContent: (repoPath, filePath) => ipcRenderer.invoke('getUncommittedFileContent', repoPath, filePath),
  merge: (repoPath, branch) => ipcRenderer.invoke('merge', repoPath, branch),
  getConflictContent: (repoPath, filePath) => ipcRenderer.invoke('getConflictContent', repoPath, filePath),
  stageResolved: (repoPath, filePath) => ipcRenderer.invoke('stageResolved', repoPath, filePath),
  completeMerge: (repoPath, message) => ipcRenderer.invoke('completeMerge', repoPath, message),
  abortMerge: repoPath => ipcRenderer.invoke('abortMerge', repoPath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  }
  catch (error) {
    console.error(error)
  }
}
else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
