import { ipcMain, dialog } from 'electron'
import { registerGitHandlers } from './git.ipc'
import { registerDirectoryHandlers } from './directory.ipc'
import { registerMergeHandlers } from './merge.ipc'

export function registerIpcHandlers(): void {
  registerGitHandlers()
  registerDirectoryHandlers()
  registerMergeHandlers()
}
