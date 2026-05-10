import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DirectoryEntry } from '@/types/git'

export const useDirectoryStore = defineStore('directory', () => {
  const recentDirectories = ref<DirectoryEntry[]>([])
  const currentPath = ref<string>('')

  const isGitRepo = computed(() => currentPath.value !== '')

  // 加载最近目录
  async function loadRecent() {
    try {
      recentDirectories.value = await window.electronAPI.getRecentDirectories()
    } catch {
      recentDirectories.value = []
    }
  }

  // 选择目录
  async function selectDirectory(): Promise<string | null> {
    try {
      const path = await window.electronAPI.selectDirectory()
      if (path) {
        currentPath.value = path
        await saveRecent(path)
      }
      return path
    } catch {
      return null
    }
  }

  // 打开历史目录
  async function openDirectory(path: string) {
    currentPath.value = path
    await saveRecent(path)
  }

  // 保存最近目录
  async function saveRecent(path: string) {
    try {
      recentDirectories.value = await window.electronAPI.saveRecentDirectory(path)
    } catch {
      // ignore
    }
  }

  // 删除历史记录
  async function removeDirectory(path: string) {
    try {
      recentDirectories.value = await window.electronAPI.removeRecentDirectory(path)
    } catch {
      // ignore
    }
  }

  return {
    recentDirectories,
    currentPath,
    isGitRepo,
    loadRecent,
    selectDirectory,
    openDirectory,
    removeDirectory
  }
})
