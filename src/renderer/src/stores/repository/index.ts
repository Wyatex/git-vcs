import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { gitService } from '@/services/git'
import type { RecentRepository, RepositorySummary } from '@/types/git'

export const useRepositoryStore = defineStore('repository', () => {
  const repoPath = ref<string | null>(null)
  const summary = ref<RepositorySummary | null>(null)
  const recentRepositories = ref<RecentRepository[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  const currentBranch = computed(() => summary.value?.currentBranch ?? null)
  const hasRepository = computed(() => Boolean(repoPath.value && summary.value?.isGitRepository))

  async function loadRecentRepositories(): Promise<void> {
    recentRepositories.value = await gitService.getRecentRepositories()
  }

  async function refreshRepository(): Promise<void> {
    if (!repoPath.value)
      return

    loading.value = true
    try {
      summary.value = await gitService.getRepositorySummary(repoPath.value)
    }
    finally {
      loading.value = false
    }
  }

  async function openRepository(nextRepoPath: string): Promise<void> {
    repoPath.value = nextRepoPath
    recentRepositories.value = await gitService.saveRecentRepository(nextRepoPath)
    await refreshRepository()
  }

  async function removeRecentRepository(targetRepoPath: string): Promise<void> {
    recentRepositories.value = await gitService.removeRecentRepository(targetRepoPath)
  }

  async function initialize(): Promise<void> {
    if (initialized.value)
      return

    initialized.value = true
    await loadRecentRepositories()
  }

  return {
    repoPath,
    summary,
    recentRepositories,
    loading,
    currentBranch,
    hasRepository,
    initialize,
    loadRecentRepositories,
    openRepository,
    refreshRepository,
    removeRecentRepository,
  }
})
