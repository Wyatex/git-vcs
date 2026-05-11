import { ipcMain } from 'electron'
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import simpleGit from 'simple-git'

export function registerMergeHandlers(): void {
  // 开始合并
  ipcMain.handle('merge:start', async (_event, repoPath: string, branch: string) => {
    const git = simpleGit(repoPath)
    try {
      const result = await git.merge([branch])
      return {
        success: result.result === 'success',
        merged: result.merged || [],
        conflicts: result.conflicts || [],
        failed: result.failed || false,
        details: result.details || {}
      }
    } catch (error: any) {
      // 合并冲突时，git.merge 会抛出异常
      const conflicts = await getConflictedFiles(repoPath)
      return {
        success: false,
        hasConflicts: true,
        conflicts,
        error: error?.message || '合并失败'
      }
    }
  })

  // 获取冲突文件的 BASE / OURS / THEIRS 内容
  ipcMain.handle('merge:get-conflict-content', async (_event, repoPath: string, filePath: string) => {
    const git = simpleGit(repoPath)
    try {
      const base = await git.show([`:1:${filePath}`])
      const ours = await git.show([`:2:${filePath}`])
      const theirs = await git.show([`:3:${filePath}`])
      const workingContent = readWorkingFile(repoPath, filePath)

      // 三向合并计算
      const mergeResult = await performThreeWayMerge(repoPath, filePath, base, ours, theirs)

      return {
        filePath,
        base,
        ours,
        theirs,
        workingContent: workingContent || mergeResult.mergedContent,
        resolved: '',
        chunks: mergeResult.chunks,
        status: 'unresolved' as const
      }
    } catch (error: any) {
      return {
        filePath,
        base: '',
        ours: '',
        theirs: '',
        workingContent: '',
        resolved: '',
        chunks: [],
        status: 'unresolved' as const,
        error: error?.message || '获取冲突内容失败'
      }
    }
  })

  // 标记文件为已解决（git add）
  ipcMain.handle('merge:stage-resolved', async (_event, repoPath: string, filePath: string) => {
    const git = simpleGit(repoPath)
    await git.add(filePath)
    return { success: true }
  })

  // 完成合并
  ipcMain.handle('merge:complete', async (_event, repoPath: string, message: string) => {
    const git = simpleGit(repoPath)
    await git.commit(message || 'Merge completed')
    return { success: true }
  })

  // 中止合并
  ipcMain.handle('merge:abort', async (_event, repoPath: string) => {
    const git = simpleGit(repoPath)
    await git.merge(['--abort'])
    return { success: true }
  })
}

async function getConflictedFiles(repoPath: string): Promise<string[]> {
  const git = simpleGit(repoPath)
  const status = await git.status()
  return status.conflicted || []
}

function readWorkingFile(repoPath: string, filePath: string): string | null {
  const fullPath = join(repoPath, filePath)
  if (!existsSync(fullPath)) return null
  return readFileSync(fullPath, 'utf-8')
}

interface MergeChunk {
  type: 'common' | 'conflict'
  lines: string[]
  oursLines: string[]
  theirsLines: string[]
}

async function performThreeWayMerge(
  repoPath: string,
  filePath: string,
  base: string,
  ours: string,
  theirs: string
): Promise<{ mergedContent: string; chunks: MergeChunk[] }> {
  // 使用 git merge-file 进行三向合并
  const baseFile = join(repoPath, `.merge_base_${Date.now()}`)
  const oursFile = join(repoPath, `.merge_ours_${Date.now()}`)
  const theirsFile = join(repoPath, `.merge_theirs_${Date.now()}`)

  try {
    // 写入临时文件
    require('fs').writeFileSync(baseFile, base, 'utf-8')
    require('fs').writeFileSync(oursFile, ours, 'utf-8')
    require('fs').writeFileSync(theirsFile, theirs, 'utf-8')

    // 执行 git merge-file
    const result = require('child_process').execSync(
      `git merge-file "${oursFile}" "${baseFile}" "${theirsFile}"`,
      { cwd: repoPath, encoding: 'utf-8' }
    )

    const mergedContent = require('fs').readFileSync(oursFile, 'utf-8')

    // 解析冲突块
    const chunks = parseConflictMarkers(mergedContent)

    return { mergedContent, chunks }
  } finally {
    // 清理临时文件
    cleanupFile(baseFile)
    cleanupFile(oursFile)
    cleanupFile(theirsFile)
  }
}

function parseConflictMarkers(content: string): MergeChunk[] {
  const chunks: MergeChunk[] = []
  const lines = content.split('\n')
  let i = 0

  while (i < lines.length) {
    if (lines[i].startsWith('<<<<<<<')) {
      const oursLines: string[] = []
      const theirsLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('=======')) {
        oursLines.push(lines[i])
        i++
      }
      i++ // skip =======
      while (i < lines.length && !lines[i].startsWith('>>>>>>>')) {
        theirsLines.push(lines[i])
        i++
      }
      i++ // skip >>>>>>>
      chunks.push({
        type: 'conflict',
        lines: ['<<<<<<< ours', ...oursLines, '=======', ...theirsLines, '>>>>>>> theirs'],
        oursLines,
        theirsLines
      })
    } else {
      const commonLines: string[] = []
      while (i < lines.length && !lines[i].startsWith('<<<<<<<')) {
        commonLines.push(lines[i])
        i++
      }
      if (commonLines.length > 0) {
        chunks.push({
          type: 'common',
          lines: commonLines,
          oursLines: commonLines,
          theirsLines: commonLines
        })
      }
    }
  }

  return chunks
}

function cleanupFile(filePath: string): void {
  try {
    if (existsSync(filePath)) {
      require('fs').unlinkSync(filePath)
    }
  } catch {
    // ignore
  }
}
