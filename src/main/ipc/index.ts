import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { dialog, ipcMain } from 'electron'
import simpleGit from 'simple-git'
import type { SimpleGit } from 'simple-git'
import type {
  BranchSummary,
  CommitDetail,
  CommitResult,
  CommitSummary,
  ConflictContent,
  ElectronApi,
  GitOperationResult,
  MergeResult,
  RecentRepository,
  RepositoryStatus,
  RepositorySummary,
  TagSummary,
} from '../../shared/git'

const RECENT_REPOS_FILE = 'recent-repositories.json'

function getAppDataDir(): string {
  return path.join(os.homedir(), '.wyatex', 'git-vcs')
}

function getRecentReposFilePath(): string {
  return path.join(getAppDataDir(), RECENT_REPOS_FILE)
}

async function ensureAppDataDir(): Promise<void> {
  await fs.mkdir(getAppDataDir(), { recursive: true })
}

async function readRecentRepositories(): Promise<RecentRepository[]> {
  try {
    const content = await fs.readFile(getRecentReposFilePath(), 'utf8')
    const parsed = JSON.parse(content) as RecentRepository[]
    return Array.isArray(parsed) ? parsed : []
  }
  catch {
    return []
  }
}

async function writeRecentRepositories(repositories: RecentRepository[]): Promise<RecentRepository[]> {
  await ensureAppDataDir()
  await fs.writeFile(getRecentReposFilePath(), JSON.stringify(repositories, null, 2), 'utf8')
  return repositories
}

function createGit(repoPath: string): SimpleGit {
  return simpleGit(repoPath)
}

async function isGitRepository(repoPath: string): Promise<boolean> {
  try {
    return await createGit(repoPath).checkIsRepo()
  }
  catch {
    return false
  }
}

async function getRepositoryStatus(repoPath: string): Promise<RepositoryStatus> {
  const git = createGit(repoPath)
  const [status, stashRaw] = await Promise.all([
    git.status(),
    git.raw(['stash', 'list']),
  ])

  const stagedFiles = status.files
    .filter(file => file.index !== ' ' && file.index !== '?')
    .map(file => file.path)

  const unstagedFiles = status.files
    .filter(file => file.working_dir !== ' ' && file.working_dir !== '?' && file.working_dir !== 'U')
    .map(file => file.path)

  const untrackedFiles = status.files
    .filter(file => file.index === '?' || file.working_dir === '?')
    .map(file => file.path)

  const stashCount = stashRaw
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
    .length

  return {
    currentBranch: status.current || null,
    detached: status.detached,
    ahead: status.ahead,
    behind: status.behind,
    mergeInProgress: status.files.some(file => file.working_dir === 'U' || file.index === 'U'),
    stashCount,
    conflicts: status.conflicted,
    stagedFiles,
    unstagedFiles,
    untrackedFiles,
  }
}

async function getRepositorySummary(repoPath: string): Promise<RepositorySummary> {
  const repoName = path.basename(repoPath)
  const valid = await isGitRepository(repoPath)
  if (!valid) {
    return {
      repoPath,
      repoName,
      isGitRepository: false,
      currentBranch: null,
      detached: false,
      ahead: 0,
      behind: 0,
      mergeInProgress: false,
      stashCount: 0,
      conflicts: [],
      fileStats: { staged: 0, unstaged: 0, untracked: 0, conflicted: 0 },
      stagedFiles: [],
      unstagedFiles: [],
      untrackedFiles: [],
      remotes: [],
    }
  }

  const git = createGit(repoPath)
  const [status, remotes] = await Promise.all([
    getRepositoryStatus(repoPath),
    git.getRemotes(true),
  ])

  return {
    repoPath,
    repoName,
    isGitRepository: true,
    currentBranch: status.currentBranch,
    detached: status.detached,
    ahead: status.ahead,
    behind: status.behind,
    mergeInProgress: status.mergeInProgress,
    stashCount: status.stashCount,
    conflicts: status.conflicts,
    fileStats: {
      staged: status.stagedFiles.length,
      unstaged: status.unstagedFiles.length,
      untracked: status.untrackedFiles.length,
      conflicted: status.conflicts.length,
    },
    stagedFiles: status.stagedFiles,
    unstagedFiles: status.unstagedFiles,
    untrackedFiles: status.untrackedFiles,
    remotes: remotes.map(remote => remote.name),
  }
}

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8')
  }
  catch {
    return null
  }
}

function toSuccess(): GitOperationResult {
  return { success: true }
}

export function registerIpcHandlers(): void {
  const handlers: Record<keyof ElectronApi, (...args: any[]) => Promise<any>> = {
    async selectDirectory() {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      })

      if (result.canceled || result.filePaths.length === 0)
        return null

      return result.filePaths[0] ?? null
    },
    async getRecentDirectories() {
      return readRecentRepositories()
    },
    async saveRecentDirectory(repoPath: string) {
      const repositories = await readRecentRepositories()
      const name = path.basename(repoPath)
      const nextEntry: RecentRepository = { path: repoPath, name, lastOpened: Date.now() }
      const filtered = repositories.filter(item => item.path !== repoPath)
      return writeRecentRepositories([nextEntry, ...filtered].slice(0, 10))
    },
    async removeRecentDirectory(repoPath: string) {
      const repositories = await readRecentRepositories()
      return writeRecentRepositories(repositories.filter(item => item.path !== repoPath))
    },
    async validateRepository(repoPath: string) {
      return isGitRepository(repoPath)
    },
    async getRepositorySummary(repoPath: string) {
      return getRepositorySummary(repoPath)
    },
    async getStatus(repoPath: string) {
      return getRepositoryStatus(repoPath)
    },
    async getBranches(repoPath: string) {
      const branches = await createGit(repoPath).branch(['-a'])
      return branches.all.map<BranchSummary>((name) => {
        const cleanName = name.replace(/^remotes\//, '')
        return {
          name: cleanName,
          current: cleanName === branches.current,
          remote: name.startsWith('remotes/'),
          commit: '',
          label: cleanName,
        }
      })
    },
    async getTags(repoPath: string) {
      const tags = await createGit(repoPath).tags()
      return tags.all.map<TagSummary>(name => ({ name, hash: '' }))
    },
    async getLog(repoPath: string, maxCount = 50) {
      const log = await createGit(repoPath).log({ maxCount })
      return log.all.map<CommitSummary>(item => ({
        hash: item.hash,
        shortHash: item.hash.slice(0, 7),
        authorName: item.author_name,
        authorEmail: item.author_email,
        date: item.date,
        message: item.message,
      }))
    },
    async getCommitDetail(repoPath: string, hash: string) {
      const git = createGit(repoPath)
      const [rawBody, rawParents, rawFiles, log] = await Promise.all([
        git.show([`${hash}`, '--format=%B', '--no-patch']),
        git.raw(['show', '-s', '--format=%P', hash]),
        git.raw(['show', '--name-only', '--format=', hash]),
        git.log({ from: `${hash}^`, to: hash, maxCount: 1 }),
      ])
      const entry = log.all[0]
      const body = rawBody.trim()
      return {
        hash,
        shortHash: hash.slice(0, 7),
        authorName: entry?.author_name ?? '',
        authorEmail: entry?.author_email ?? '',
        date: entry?.date ?? '',
        message: entry?.message ?? body.split('\n')[0] ?? '',
        body,
        parents: rawParents.trim().split(' ').filter(Boolean),
        files: rawFiles.split('\n').map(item => item.trim()).filter(Boolean),
      } satisfies CommitDetail
    },
    async getFileDiff(repoPath: string, hash: string, filePath: string) {
      return createGit(repoPath).diff([`${hash}^!`, '--', filePath])
    },
    async checkout(repoPath: string, ref: string) {
      await createGit(repoPath).checkout(ref)
      return toSuccess()
    },
    async createBranch(repoPath: string, name: string, startPoint?: string) {
      const git = createGit(repoPath)
      if (startPoint)
        await git.checkoutBranch(name, startPoint)
      else
        await git.checkoutLocalBranch(name)
      return toSuccess()
    },
    async deleteBranch(repoPath: string, name: string, force = false) {
      await createGit(repoPath).deleteLocalBranch(name, force)
      return toSuccess()
    },
    async createTag(repoPath: string, name: string, message?: string) {
      const git = createGit(repoPath)
      if (message)
        await git.addAnnotatedTag(name, message)
      else
        await git.addTag(name)
      return toSuccess()
    },
    async deleteTag(repoPath: string, name: string) {
      await createGit(repoPath).tag(['-d', name])
      return toSuccess()
    },
    async commit(repoPath: string, message: string) {
      const result = await createGit(repoPath).commit(message)
      return {
        success: true,
        hash: result.commit || '',
      } satisfies CommitResult
    },
    async add(repoPath: string, files: string[]) {
      await createGit(repoPath).add(files)
      return toSuccess()
    },
    async stageAll(repoPath: string) {
      await createGit(repoPath).add(['.'])
      return toSuccess()
    },
    async getFileContent(repoPath: string, hash: string, filePath: string) {
      try {
        return await createGit(repoPath).show([`${hash}:${filePath}`])
      }
      catch {
        return null
      }
    },
    async getWorkingFileContent(repoPath: string, filePath: string) {
      return readFileSafe(path.join(repoPath, filePath))
    },
    async getUncommittedFileContent(repoPath: string, filePath: string) {
      return readFileSafe(path.join(repoPath, filePath))
    },
    async merge(repoPath: string, branch: string) {
      const git = createGit(repoPath)
      try {
        const result = await git.merge([branch])
        return {
          success: true,
          status: result.conflicts.length > 0 ? 'conflicted' : 'success',
          conflicts: (result.conflicts ?? []).map(item => item.file).filter((item): item is string => Boolean(item)),
          message: result.summary.changes ? 'Merge completed' : 'Already up to date',
        } satisfies MergeResult
      }
      catch {
        const status = await git.status()
        return {
          success: true,
          status: 'conflicted',
          conflicts: status.conflicted,
          message: 'Merge has conflicts',
        } satisfies MergeResult
      }
    },
    async getConflictContent(repoPath: string, filePath: string) {
      return {
        content: await readFileSafe(path.join(repoPath, filePath)),
      } satisfies ConflictContent
    },
    async stageResolved(repoPath: string, filePath: string) {
      await createGit(repoPath).add(filePath)
      return toSuccess()
    },
    async completeMerge(repoPath: string, message: string) {
      await createGit(repoPath).commit(message)
      return toSuccess()
    },
    async abortMerge(repoPath: string) {
      await createGit(repoPath).merge(['--abort'])
      return toSuccess()
    },

    // 取消暂存功能
    async unstage(repoPath: string, files: string[]) {
      if (!files || files.length === 0)
        return toSuccess()
      const git = createGit(repoPath)
      try {
        // 大多数情况使用 reset HEAD
        await git.reset(['HEAD', '--', ...files])
      }
      catch {
        // 针对没有 HEAD 的初始提交情况，退回到 rm --cached
        await git.rm(['--cached', '--', ...files])
      }
      return toSuccess()
    },

    // 部分暂存功能（采用安全的 Git 底层命令，绝对不破坏本地工作区）
    async stagePartialContent(repoPath: string, filePath: string, content: string) {
      const git = createGit(repoPath)
      // 将想要暂存的内容写入系统临时目录
      const tempPath = path.join(os.tmpdir(), `git-partial-${randomUUID()}`)
      await fs.writeFile(tempPath, content, 'utf8')

      try {
        // 1. 将临时文件转化为 git blob 对象，获取对象 Hash
        const blobHash = (await git.raw(['hash-object', '-w', tempPath])).trim()

        // 2. 获取该文件原本的 mode (权限)，如果是新文件默认给 100644
        let mode = '100644'
        const lsFiles = await git.raw(['ls-files', '-s', filePath])
        if (lsFiles) {
          const match = lsFiles.match(/^(\d+)/)
          if (match)
            mode = match[1]
        }

        // 3. 将新组装好的 blob 对象直接写入 Git Index (暂存区)
        await git.raw(['update-index', '--cacheinfo', `${mode},${blobHash},${filePath}`])

        return toSuccess()
      }
      finally {
        // 无论成功失败，清理掉临时文件
        await fs.unlink(tempPath).catch(() => {})
      }
    },
  }

  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, async (_, ...args) => handler(...args))
  }
}
