import type { RecentRepository, RepositorySummary } from '@/types/git'

export const gitService = {
  selectDirectory() {
    return window.api.selectDirectory()
  },
  getRecentRepositories(): Promise<RecentRepository[]> {
    return window.api.getRecentDirectories()
  },
  saveRecentRepository(repoPath: string): Promise<RecentRepository[]> {
    return window.api.saveRecentDirectory(repoPath)
  },
  removeRecentRepository(repoPath: string): Promise<RecentRepository[]> {
    return window.api.removeRecentDirectory(repoPath)
  },
  validateRepository(repoPath: string) {
    return window.api.validateRepository(repoPath)
  },
  getRepositorySummary(repoPath: string): Promise<RepositorySummary> {
    return window.api.getRepositorySummary(repoPath)
  },
}
