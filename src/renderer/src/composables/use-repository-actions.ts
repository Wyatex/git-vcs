import { ref } from 'vue'
import { gitService } from '@/services/git'
import { useRepositoryStore } from '@/stores/repository'

export function useRepositoryActions() {
  const repositoryStore = useRepositoryStore()
  const openingRepository = ref(false)

  async function openRepository(repoPath?: string): Promise<void> {
    openingRepository.value = true

    try {
      const selectedPath = repoPath ?? await gitService.selectDirectory()
      if (!selectedPath)
        return

      const valid = await gitService.validateRepository(selectedPath)
      if (!valid) {
        window.$message?.error('所选目录不是 Git 仓库')
        return
      }

      await repositoryStore.openRepository(selectedPath)
      window.$message?.success('仓库已加载')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : '仓库加载失败'
      window.$message?.error(message)
    }
    finally {
      openingRepository.value = false
    }
  }

  async function removeRecentRepository(repoPath: string): Promise<void> {
    try {
      await repositoryStore.removeRecentRepository(repoPath)
      window.$message?.success('已移除最近仓库记录')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : '移除失败'
      window.$message?.error(message)
    }
  }

  return {
    openingRepository,
    openRepository,
    removeRecentRepository
  }
}
