import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BranchInfo, Commit, TagInfo, StatusResult, FileChange, CommitDetail } from '@/types/git'

export const useGitStore = defineStore('git', () => {
  // 当前仓库路径
  const repoPath = ref<string>('')
  const isRepoLoaded = computed(() => repoPath.value !== '')

  // 分支
  const branches = ref<BranchInfo[]>([])
  const currentBranch = computed(() => branches.value.find((b) => b.isCurrent))

  // 标签
  const tags = ref<TagInfo[]>([])

  // 提交历史
  const commits = ref<Commit[]>([])

  // 当前状态
  const status = ref<StatusResult | null>(null)
  const fileChanges = computed<FileChange[]>(() => status.value?.files || [])
  const conflictedFiles = computed<string[]>(() => status.value?.conflicted || [])
  const stagedFiles = computed(() => fileChanges.value.filter((f) => f.staged))
  const unstagedFiles = computed(() => fileChanges.value.filter((f) => !f.staged))

  // 加载中
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 设置仓库路径
  function setRepoPath(path: string) {
    repoPath.value = path
  }

  // 加载分支
  async function loadBranches() {
    if (!repoPath.value) return
    try {
      branches.value = await window.electronAPI.getBranches(repoPath.value)
    } catch (e: any) {
      error.value = e.message
    }
  }

  // 加载标签
  async function loadTags() {
    if (!repoPath.value) return
    try {
      const tagList = await window.electronAPI.getTags(repoPath.value)
      tags.value = tagList
    } catch (e: any) {
      error.value = e.message
    }
  }

  // 加载提交历史
  async function loadCommits(maxCount = 100) {
    if (!repoPath.value) return
    loading.value = true
    try {
      const result = await window.electronAPI.getLog(repoPath.value, maxCount)
      commits.value = result as Commit[]
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // 加载仓库状态
  async function loadStatus() {
    if (!repoPath.value) return
    try {
      status.value = await window.electronAPI.getStatus(repoPath.value)
    } catch (e: any) {
      error.value = e.message
    }
  }

  // 检出分支
  async function checkout(ref: string) {
    if (!repoPath.value) return
    await window.electronAPI.checkout(repoPath.value, ref)
    await Promise.all([loadBranches(), loadCommits(), loadStatus()])
  }

  // 创建分支
  async function createBranch(name: string, startPoint?: string) {
    if (!repoPath.value) return
    await window.electronAPI.createBranch(repoPath.value, name, startPoint)
    await loadBranches()
  }

  // 删除分支
  async function deleteBranch(name: string, force = false) {
    if (!repoPath.value) return
    await window.electronAPI.deleteBranch(repoPath.value, name, force)
    await loadBranches()
  }

  // 创建标签
  async function createTag(name: string, message?: string) {
    if (!repoPath.value) return
    await window.electronAPI.createTag(repoPath.value, name, message)
    await loadTags()
  }

  // 删除标签
  async function deleteTag(name: string) {
    if (!repoPath.value) return
    await window.electronAPI.deleteTag(repoPath.value, name)
    await loadTags()
  }

  // 提交
  async function commit(message: string) {
    if (!repoPath.value) return
    const result = await window.electronAPI.commit(repoPath.value, message)
    await Promise.all([loadCommits(), loadStatus()])
    return result
  }

  // 添加文件
  async function addFiles(files: string[]) {
    if (!repoPath.value) return
    await window.electronAPI.add(repoPath.value, files)
    await loadStatus()
  }

  // 暂存所有
  async function stageAll() {
    if (!repoPath.value) return
    await window.electronAPI.stageAll(repoPath.value)
    await loadStatus()
  }

  // 刷新所有数据
  async function refreshAll() {
    await Promise.all([
      loadBranches(),
      loadTags(),
      loadCommits(),
      loadStatus()
    ])
  }

  return {
    repoPath,
    isRepoLoaded,
    branches,
    currentBranch,
    tags,
    commits,
    status,
    fileChanges,
    conflictedFiles,
    stagedFiles,
    unstagedFiles,
    loading,
    error,
    setRepoPath,
    loadBranches,
    loadTags,
    loadCommits,
    loadStatus,
    checkout,
    createBranch,
    deleteBranch,
    createTag,
    deleteTag,
    commit,
    addFiles,
    stageAll,
    refreshAll
  }
})
