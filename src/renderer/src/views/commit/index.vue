<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { diffLines } from 'diff'
import { useRepositoryStore } from '@/stores/repository'
import type { Change } from 'diff'

const repositoryStore = useRepositoryStore()
const summary = computed(() => repositoryStore.summary)

const commitMessage = ref('')
const committing = ref(false)

// 常用 Message 快捷插入
const quickMessages = [
  { label: 'feat', text: 'feat(scope): ', type: 'info' as const },
  { label: 'fix', text: 'fix(scope): ', type: 'success' as const },
  { label: 'docs', text: 'docs(scope): ', type: 'warning' as const },
  { label: 'style', text: 'style(scope): ', type: 'default' as const },
  { label: 'refactor', text: 'refactor(scope): ', type: 'primary' as const },
  { label: 'Close #', text: '\n\nClose #', type: 'error' as const },
]

interface SelectableChange extends Change {
  id: string
  selected: boolean
}

interface FileState {
  path: string
  status: 'staged' | 'unstaged' | 'untracked' | 'conflicted'
  checked: boolean
  indeterminate: boolean
  changes: SelectableChange[] | null
  loading: boolean
}

const files = ref<FileState[]>([])
const activeFile = ref<FileState | null>(null)

// 监听仓库状态更新，同步文件列表
watch(summary, (newSummary) => {
  if (!newSummary) {
    files.value = []
    activeFile.value = null
    return
  }

  const currentFilesMap = new Map(files.value.map(f => [f.path, f]))
  const nextFiles: FileState[] = []

  const addFile = (path: string, status: FileState['status']) => {
    if (currentFilesMap.has(path)) {
      const existing = currentFilesMap.get(path)!
      existing.status = status
      nextFiles.push(existing)
    }
    else {
      nextFiles.push({
        path,
        status,
        checked: status === 'staged', // 默认选中已暂存的文件
        indeterminate: false,
        changes: null,
        loading: false,
      })
    }
  }

  newSummary.stagedFiles.forEach(f => addFile(f, 'staged'))
  newSummary.unstagedFiles.forEach(f => addFile(f, 'unstaged'))
  newSummary.untrackedFiles.forEach(f => addFile(f, 'untracked'))

  files.value = nextFiles

  // 检查当前正在比对的文件是否还在更改列表中，如果不在则清空右侧显示
  if (activeFile.value) {
    const exists = nextFiles.find(f => f.path === activeFile.value!.path)
    if (exists) {
      activeFile.value = exists
    }
    else {
      activeFile.value = null
    }
  }
}, { immediate: true })

const allFilesChecked = computed(() => files.value.length > 0 && files.value.every(f => f.checked))
const someFilesChecked = computed(() => files.value.some(f => f.checked || f.indeterminate))

// 快捷插入文本
function insertText(text: string) {
  commitMessage.value += text
}

// 解决 diffLines 尾部换行引发的空白问题
function getChangeLines(value: string) {
  const lines = value.split('\n')
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }
  return lines
}

function getStatusColor(status: FileState['status']) {
  switch (status) {
    case 'staged': return 'success'
    case 'unstaged': return 'warning'
    case 'untracked': return 'error'
    case 'conflicted': return 'error'
    default: return 'default'
  }
}

function toggleAllFiles(checked: boolean) {
  files.value.forEach((f) => {
    f.checked = checked
    f.indeterminate = false
    if (f.changes) {
      f.changes.forEach((c) => {
        if (c.added || c.removed)
          c.selected = checked
      })
    }
  })
}

// 选中某个文件查看 Diff
async function selectFile(file: FileState) {
  activeFile.value = file

  // 保证每次点击文件都能重新拉取并计算最新 Diff
  if (file.loading)
    return

  file.loading = true
  try {
    const repoPath = repositoryStore.repoPath!
    // 对于 untracked 文件，HEAD 并没有该文件内容
    const headContent = file.status === 'untracked'
      ? ''
      : await window.api.getFileContent(repoPath, 'HEAD', file.path).catch(() => '') || ''

    // 获取当前工作区该文件的内容
    const workContent = await window.api.getWorkingFileContent(repoPath, file.path).catch(() => '') || ''

    const diffResult = diffLines(headContent, workContent)
    file.changes = diffResult.map((change, index) => ({
      ...change,
      id: `${index}`,
      selected: file.checked,
    }))
    updateFileCheckState(file)
  }
  catch (error) {
    console.error('Failed to load diff for', file.path, error)
  }
  finally {
    file.loading = false
  }
}

// 勾选/取消勾选具体的某块代码差异
function toggleChangeSelection(file: FileState, change: SelectableChange) {
  change.selected = !change.selected
  updateFileCheckState(file)
}

function updateFileCheckState(file: FileState) {
  if (!file.changes)
    return
  const modifiableChanges = file.changes.filter(c => c.added || c.removed)
  if (modifiableChanges.length === 0)
    return

  const allSelected = modifiableChanges.every(c => c.selected)
  const someSelected = modifiableChanges.some(c => c.selected)

  file.checked = allSelected
  file.indeterminate = someSelected && !allSelected
}

function toggleFileSelection(file: FileState) {
  file.checked = !file.checked
  file.indeterminate = false
  if (file.changes) {
    file.changes.forEach((c) => {
      if (c.added || c.removed) {
        c.selected = file.checked
      }
    })
  }
}

// 核心逻辑：获取处理后需要提交的部分内容（组装选中的 Hunk）
function getStagedContent(file: FileState): string {
  if (!file.changes)
    return ''
  let content = ''
  for (const change of file.changes) {
    if (change.added && change.selected) {
      content += change.value
    }
    else if (change.removed && !change.selected) {
      // 如果移除操作未被选中提交，说明我们要保留这部分内容到暂存区中
      content += change.value
    }
    else if (!change.added && !change.removed) {
      content += change.value
    }
  }
  return content
}

async function handleCommit() {
  if (!commitMessage.value.trim()) {
    window.$message?.warning('请输入提交信息')
    return
  }

  const fullyCheckedFiles = files.value.filter(f => f.checked && !f.indeterminate).map(f => f.path)
  const partiallyCheckedFiles = files.value.filter(f => f.indeterminate)
  const uncheckedStaged = files.value.filter(f => !f.checked && !f.indeterminate && f.status === 'staged').map(f => f.path)

  if (fullyCheckedFiles.length === 0 && partiallyCheckedFiles.length === 0) {
    window.$message?.warning('请选择要提交的文件或行')
    return
  }

  committing.value = true
  try {
    const repoPath = repositoryStore.repoPath!

    // 1. 对于之前已被暂存，但在 UI 中取消勾选的文件，执行取消暂存 (Unstage)
    if (uncheckedStaged.length > 0) {
      await window.api.unstage(repoPath, uncheckedStaged)
    }

    // 2. 对于完全选中的文件，执行全量 Add (包含修改和新增)
    if (fullyCheckedFiles.length > 0) {
      await window.api.add(repoPath, fullyCheckedFiles)
    }

    // 3. 对于部分选中的文件，执行部分暂存 (将内存中组装好的代码片段直接覆盖进暂存区)
    if (partiallyCheckedFiles.length > 0) {
      for (const file of partiallyCheckedFiles) {
        const partialContent = getStagedContent(file)
        await window.api.stagePartialContent(repoPath, file.path, partialContent)
      }
    }

    // 4. 暂存区已准备就绪，执行最终的 Commit
    const result = await window.api.commit(repoPath, commitMessage.value)
    if (result.success) {
      window.$message?.success('提交成功')
      commitMessage.value = ''
      // 清空激活的文件和列表缓存，防止展示旧数据
      activeFile.value = null
      files.value = []
      await repositoryStore.refreshRepository()
    }
    else {
      window.$message?.error(`提交失败: 未知错误`)
    }
  }
  catch (error) {
    console.error(error)
    window.$message?.error('提交过程发生异常')
  }
  finally {
    committing.value = false
  }
}
</script>

<template>
  <NCard title="提交工作台" :bordered="false" class="h-full">
    <NEmpty v-if="!summary" description="请先打开一个 Git 仓库" />
    <div v-else class="grid items-start gap-4 lg:grid-cols-[360px_1fr]">
      <!-- 左侧区域：信息填写与文件树 -->
      <div class="h-full flex flex-col gap-4">
        <!-- 提交信息区 -->
        <NCard embedded title="提交信息" size="small">
          <!-- 快捷插入区 -->
          <div class="mb-2 flex flex-wrap gap-2">
            <NButton
              v-for="msg in quickMessages"
              :key="msg.label"
              size="tiny"
              secondary
              :type="msg.type"
              @click="insertText(msg.text)"
            >
              {{ msg.label }}
            </NButton>
          </div>
          <NInput
            v-model:value="commitMessage"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="填写你的 commit message..."
          />
          <div class="mt-3 flex justify-end">
            <NButton type="primary" :loading="committing" @click="handleCommit">
              提交 (Commit)
            </NButton>
          </div>
        </NCard>

        <!-- 更改的文件列表 -->
        <NCard embedded title="更改的文件" size="small" class="flex flex-1 flex-col" content-style="padding-top: 0; padding-bottom: 0;">
          <template #header-extra>
            <NCheckbox
              :checked="allFilesChecked"
              :indeterminate="someFilesChecked && !allFilesChecked"
              @update:checked="toggleAllFiles"
            >
              全选
            </NCheckbox>
          </template>

          <div class="my-2 max-h-[40vh] min-h-[260px] overflow-auto border border-[rgb(var(--border-color))] rounded-md">
            <NList hoverable clickable>
              <NListItem
                v-for="file in files"
                :key="file.path"
                :class="{ 'bg-[rgba(var(--primary-color-hover),0.1)]': activeFile?.path === file.path }"
                @click="selectFile(file)"
              >
                <div class="flex items-center gap-2 px-1">
                  <NCheckbox
                    :checked="file.checked"
                    :indeterminate="file.indeterminate"
                    @click.stop
                    @update:checked="toggleFileSelection(file)"
                  />
                  <span class="text-sm flex-1 cursor-pointer truncate" :title="file.path">
                    {{ file.path }}
                  </span>
                  <NTag size="small" :type="getStatusColor(file.status)">
                    {{ file.status }}
                  </NTag>
                </div>
              </NListItem>
              <NListItem v-if="files.length === 0">
                <div class="py-4 text-center text-gray-400">
                  工作区干净
                </div>
              </NListItem>
            </NList>
          </div>
        </NCard>
      </div>

      <!-- 右侧区域：代码比对与部分行选取 -->
      <NCard embedded title="代码比对及选取 (Diff)" size="small" class="h-full min-h-[500px] flex flex-col">
        <div
          v-if="activeFile"
          class="text-sm relative flex-1 overflow-auto overflow-x-auto border border-[rgb(var(--border-color))] rounded-md bg-[rgb(var(--card-color))] font-mono"
        >
          <div v-if="activeFile.loading" class="p-4 opacity-60">
            正在加载差异...
          </div>
          <div v-else-if="!activeFile.changes" class="p-4 opacity-60">
            无差异内容
          </div>
          <div v-else class="py-2">
            <div
              v-for="change in activeFile.changes"
              :key="change.id"
              class="flex"
            >
              <!-- 选取列 -->
              <div class="w-10 flex flex-shrink-0 flex-col select-none items-center border-r border-[rgb(var(--border-color))] bg-[rgba(125,125,125,0.05)] py-1">
                <NCheckbox
                  v-if="change.added || change.removed"
                  :checked="change.selected"
                  size="small"
                  @update:checked="toggleChangeSelection(activeFile, change)"
                />
              </div>
              <!-- 代码高亮展示区 -->
              <div
                class="flex-1 overflow-hidden px-2 py-1"
                :class="{
                  'bg-[rgba(24,160,88,0.1)] text-[rgb(24,160,88)]': change.added,
                  'bg-[rgba(208,48,80,0.1)] text-[rgb(208,48,80)]': change.removed,
                  'opacity-80': !change.added && !change.removed,
                }"
              >
                <!-- 按行循环 -->
                <div v-for="(line, i) in getChangeLines(change.value)" :key="i" class="min-h-[1.5em] flex leading-6">
                  <span class="inline-block w-6 select-none pr-2 text-right opacity-50">
                    {{ change.added ? '+' : (change.removed ? '-' : ' ') }}
                  </span>
                  <span class="flex-1 whitespace-pre-wrap break-all">{{ line }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <NEmpty v-else description="在左侧选择一个文件查看差异" class="mt-20" />
      </NCard>
    </div>
  </NCard>
</template>
