import { ipcMain } from 'electron'
import { join } from 'path'
import simpleGit, { SimpleGit } from 'simple-git'
import { readFileSync, existsSync } from 'fs'

function getGit(repoPath: string): SimpleGit {
  return simpleGit(repoPath)
}

export function registerGitHandlers(): void {
  // 获取仓库状态
  ipcMain.handle('git:status', async (_event, repoPath: string) => {
    const git = getGit(repoPath)
    const status = await git.status()
    return {
      current: status.current,
      tracking: status.tracking,
      files: status.files.map((f) => ({
        path: f.path,
        working_dir: f.working_dir,
        index: f.index,
        staged: f.index !== ' '
      })),
      ahead: status.ahead,
      behind: status.behind,
      conflicted: status.conflicted
    }
  })

  // 获取分支列表
  ipcMain.handle('git:branches', async (_event, repoPath: string) => {
    const git = getGit(repoPath)
    const branches = await git.branch()
    const allBranches = branches.all.map((name) => {
      const isCurrent = name === branches.current
      const branchInfo = branches.branches[name]
      return {
        name,
        isCurrent,
        isRemote: name.startsWith('remotes/'),
        commitHash: branchInfo.commit,
        label: branchInfo.label,
        behind: branchInfo.behind,
        ahead: branchInfo.ahead
      }
    })
    return allBranches
  })

  // 获取标签列表
  ipcMain.handle('git:tags', async (_event, repoPath: string) => {
    const git = getGit(repoPath)
    const tags = await git.tags()
    return tags.all.map((name) => ({
      name,
      commitHash: ''
    }))
  })

  // 获取提交日志
  ipcMain.handle('git:log', async (_event, repoPath: string, maxCount = 100) => {
    const git = getGit(repoPath)
    // 使用 --all 获取所有分支的提交，用于地铁图
    const log = await git.log(['--all', `--max-count=${maxCount}`, '--format=%H|%an|%ae|%ai|%s|%P|%D'])
    return log.all.map((commit) => {
      const parts = commit.hash.split('|')
      return {
        hash: parts[0] || commit.hash,
        authorName: commit.author_name,
        authorEmail: commit.author_email,
        date: commit.date,
        message: commit.message,
        body: commit.body || '',
        parents: commit.refs ? commit.refs.split(' ').filter(Boolean) : [],
        refs: []
      }
    })
  })

  // 获取提交详情
  ipcMain.handle('git:commit-detail', async (_event, repoPath: string, hash: string) => {
    const git = getGit(repoPath)
    const show = await git.show(['--format=%H|%an|%ae|%ai|%s|%b|%P|%D', '--name-only', hash])
    const lines = show.split('\n')
    const headerParts = lines[0]?.split('|') || []
    const diffIndex = lines.indexOf('') || lines.length
    const files = lines.slice(diffIndex + 1).filter(Boolean)
    return {
      hash: headerParts[0] || hash,
      authorName: headerParts[1] || '',
      authorEmail: headerParts[2] || '',
      date: headerParts[3] || '',
      message: headerParts[4] || '',
      body: headerParts[5] || '',
      parents: headerParts[6] ? headerParts[6].split(' ') : [],
      refs: headerParts[7] ? headerParts[7].split(', ') : [],
      files
    }
  })

  // 获取文件变更差异
  ipcMain.handle('git:file-diff', async (_event, repoPath: string, hash: string, filePath: string) => {
    const git = getGit(repoPath)
    try {
      const diff = await git.show([`${hash}:${filePath}`])
      return diff
    } catch {
      return ''
    }
  })

  // 检出分支/提交
  ipcMain.handle('git:checkout', async (_event, repoPath: string, ref: string) => {
    const git = getGit(repoPath)
    await git.checkout(ref)
    return { success: true }
  })

  // 创建分支
  ipcMain.handle('git:create-branch', async (_event, repoPath: string, name: string, startPoint?: string) => {
    const git = getGit(repoPath)
    const args = startPoint ? [name, startPoint] : [name]
    await git.branch(args)
    return { success: true }
  })

  // 删除分支
  ipcMain.handle('git:delete-branch', async (_event, repoPath: string, name: string, force = false) => {
    const git = getGit(repoPath)
    if (force) {
      await git.deleteLocalBranch(name, true)
    } else {
      await git.deleteLocalBranch(name)
    }
    return { success: true }
  })

  // 创建标签
  ipcMain.handle('git:create-tag', async (_event, repoPath: string, name: string, message?: string) => {
    const git = getGit(repoPath)
    if (message) {
      await git.addTag(name)
      // 对于 annotated tag 需要额外处理
    } else {
      await git.addTag(name)
    }
    return { success: true }
  })

  // 删除标签
  ipcMain.handle('git:delete-tag', async (_event, repoPath: string, name: string) => {
    const git = getGit(repoPath)
    await git.tag(['-d', name])
    return { success: true }
  })

  // 提交
  ipcMain.handle('git:commit', async (_event, repoPath: string, message: string) => {
    const git = getGit(repoPath)
    const result = await git.commit(message)
    return { success: true, hash: result.commit }
  })

  // 添加文件到暂存区
  ipcMain.handle('git:add', async (_event, repoPath: string, files: string[]) => {
    const git = getGit(repoPath)
    await git.add(files)
    return { success: true }
  })

  // 添加所有更改到暂存区
  ipcMain.handle('git:stage-all', async (_event, repoPath: string) => {
    const git = getGit(repoPath)
    await git.add('.')
    return { success: true }
  })

  // 获取指定提交中的文件内容
  ipcMain.handle('git:file-content', async (_event, repoPath: string, hash: string, filePath: string) => {
    const git = getGit(repoPath)
    try {
      const content = await git.show([`${hash}:${filePath}`])
      return content
    } catch {
      return null
    }
  })

  // 获取工作区文件内容
  ipcMain.handle('git:working-file-content', async (_event, repoPath: string, filePath: string) => {
    const fullPath = join(repoPath, filePath)
    if (!existsSync(fullPath)) return null
    return readFileSync(fullPath, 'utf-8')
  })

  // 获取暂存区（索引）文件内容
  ipcMain.handle('git:uncommitted-file-content', async (_event, repoPath: string, filePath: string) => {
    const git = getGit(repoPath)
    try {
      const content = await git.show([`:0:${filePath}`])
      return content
    } catch {
      return null
    }
  })
}
