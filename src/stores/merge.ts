import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ConflictFile, MergeResult } from '@/types/git'

export const useMergeStore = defineStore('merge', () => {
  const isMerging = ref(false)
  const conflictFiles = ref<ConflictFile[]>([])
  const currentFileIndex = ref(0)
  const mergeResult = ref<MergeResult | null>(null)

  const currentFile = computed<ConflictFile | null>(() => {
    if (currentFileIndex.value < 0 || currentFileIndex.value >= conflictFiles.value.length) {
      return null
    }
    return conflictFiles.value[currentFileIndex.value]
  })

  const resolvedCount = computed(() =>
    conflictFiles.value.filter((f) => f.status === 'resolved').length
  )

  const totalConflicts = computed(() => conflictFiles.value.length)

  const allResolved = computed(() =>
    conflictFiles.value.length > 0 && resolvedCount.value === totalConflicts.value
  )

  // 开始合并
  async function startMerge(repoPath: string, branch: string) {
    isMerging.value = true
    mergeResult.value = null
    conflictFiles.value = []
    currentFileIndex.value = 0

    try {
      const result = await window.electronAPI.merge(repoPath, branch)
      mergeResult.value = result

      if (result.hasConflicts && result.conflicts) {
        // 加载每个冲突文件的内容
        const files: ConflictFile[] = []
        for (const filePath of result.conflicts) {
          const content = await window.electronAPI.getConflictContent(repoPath, filePath)
          files.push(content)
        }
        conflictFiles.value = files
      }

      return result
    } catch (e: any) {
      mergeResult.value = { success: false, error: e.message }
      return mergeResult.value
    } finally {
      isMerging.value = false
    }
  }

  // 更新当前冲突文件的解决内容
  function updateResolvedContent(content: string) {
    const file = currentFile.value
    if (file) {
      file.resolved = content
    }
  }

  // 标记文件为已解决
  async function markResolved(repoPath: string, filePath: string) {
    const file = conflictFiles.value.find((f) => f.filePath === filePath)
    if (file) {
      file.status = 'resolved'
      await window.electronAPI.stageResolved(repoPath, filePath)
    }
  }

  // 导航到上一个/下一个冲突文件
  function nextFile() {
    if (currentFileIndex.value < conflictFiles.value.length - 1) {
      currentFileIndex.value++
    }
  }

  function prevFile() {
    if (currentFileIndex.value > 0) {
      currentFileIndex.value--
    }
  }

  // 设置当前文件索引
  function setCurrentFile(index: number) {
    if (index >= 0 && index < conflictFiles.value.length) {
      currentFileIndex.value = index
    }
  }

  // 完成合并
  async function completeMerge(repoPath: string, message: string) {
    return await window.electronAPI.completeMerge(repoPath, message)
  }

  // 中止合并
  async function abortMerge(repoPath: string) {
    const result = await window.electronAPI.abortMerge(repoPath)
    if (result.success) {
      reset()
    }
    return result
  }

  // 重置状态
  function reset() {
    isMerging.value = false
    conflictFiles.value = []
    currentFileIndex.value = 0
    mergeResult.value = null
  }

  return {
    isMerging,
    conflictFiles,
    currentFileIndex,
    currentFile,
    resolvedCount,
    totalConflicts,
    allResolved,
    mergeResult,
    startMerge,
    updateResolvedContent,
    markResolved,
    nextFile,
    prevFile,
    setCurrentFile,
    completeMerge,
    abortMerge,
    reset
  }
})
