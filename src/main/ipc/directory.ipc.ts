import { ipcMain, dialog } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

const RECENT_DIRS_FILE = 'recent-directories.json'

function getConfigPath(): string {
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }
  return join(userDataPath, RECENT_DIRS_FILE)
}

function loadRecentDirectories(): Array<{ path: string; name: string; lastOpened: number }> {
  const configPath = getConfigPath()
  if (!existsSync(configPath)) return []
  try {
    const data = readFileSync(configPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveRecentDirectories(dirs: Array<{ path: string; name: string; lastOpened: number }>): void {
  const configPath = getConfigPath()
  writeFileSync(configPath, JSON.stringify(dirs, null, 2), 'utf-8')
}

export function registerDirectoryHandlers(): void {
  // 选择目录
  ipcMain.handle('directory:select', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择 Git 仓库目录'
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  // 获取最近打开的目录列表
  ipcMain.handle('directory:get-recent', async () => {
    return loadRecentDirectories()
  })

  // 保存最近打开的目录
  ipcMain.handle('directory:save-recent', async (_event, dirPath: string) => {
    const dirs = loadRecentDirectories()
    const existing = dirs.findIndex((d) => d.path === dirPath)
    const name = dirPath.split('\\').pop() || dirPath.split('/').pop() || dirPath

    const entry = { path: dirPath, name, lastOpened: Date.now() }

    if (existing >= 0) {
      dirs.splice(existing, 1)
    }

    dirs.unshift(entry)

    // 最多保留 20 条
    if (dirs.length > 20) {
      dirs.length = 20
    }

    saveRecentDirectories(dirs)
    return dirs
  })

  // 删除最近打开的目录
  ipcMain.handle('directory:remove-recent', async (_event, dirPath: string) => {
    const dirs = loadRecentDirectories()
    const filtered = dirs.filter((d) => d.path !== dirPath)
    saveRecentDirectories(filtered)
    return filtered
  })
}
