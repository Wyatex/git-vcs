<template>
  <div class="merge-view">
    <div class="view-header">
      <h1>合并</h1>
    </div>

    <!-- 未处于合并状态：选择分支合并 -->
    <div v-if="!mergeStore.isMerging && !mergeStore.mergeResult" class="merge-init">
      <div class="merge-form">
        <div class="form-row">
          <label>当前分支</label>
          <div class="current-branch-display">{{ gitStore.currentBranch?.name || '-' }}</div>
        </div>
        <div class="form-row">
          <label>合并来源分支</label>
          <select v-model="selectedBranch" class="select">
            <option value="">请选择分支</option>
            <option v-for="b in otherBranches" :key="b.name" :value="b.name">{{ b.name }}</option>
          </select>
        </div>
        <button
          class="btn btn-primary"
          :disabled="!selectedBranch"
          @click="doMerge"
        >
          合并到 {{ gitStore.currentBranch?.name }}
        </button>
      </div>
    </div>

    <!-- 合并冲突解决 -->
    <div v-else-if="mergeStore.conflictFiles.length > 0" class="conflict-resolver">
      <div class="conflict-header">
        <h2>解决合并冲突</h2>
        <div class="conflict-progress">
          {{ mergeStore.resolvedCount }}/{{ mergeStore.totalConflicts }} 已解决
        </div>
      </div>

      <!-- 冲突文件列表 -->
      <div class="conflict-file-list">
        <div
          v-for="(file, index) in mergeStore.conflictFiles"
          :key="file.filePath"
          class="conflict-file-item"
          :class="{ active: index === mergeStore.currentFileIndex, resolved: file.status === 'resolved' }"
          @click="mergeStore.setCurrentFile(index)"
        >
          <span class="file-status-icon">{{ file.status === 'resolved' ? '✓' : '✗' }}</span>
          <span class="file-name">{{ file.filePath }}</span>
        </div>
      </div>

      <!-- 冲突内容编辑器 -->
      <div v-if="mergeStore.currentFile" class="conflict-editor">
        <div class="editor-header">
          <span class="editor-file">{{ mergeStore.currentFile.filePath }}</span>
          <div class="editor-actions">
            <button class="btn-sm" @click="useOurs">使用我们的</button>
            <button class="btn-sm" @click="useTheirs">使用他们的</button>
            <button
              class="btn-sm btn-primary"
              @click="markResolved"
            >
              标记已解决
            </button>
          </div>
        </div>
        <textarea
          v-model="editContent"
          class="conflict-textarea"
          spellcheck="false"
        ></textarea>
      </div>

      <!-- 完成/中止 -->
      <div class="conflict-footer">
        <button class="btn btn-cancel" @click="abortMerge">中止合并</button>
        <button
          class="btn btn-primary"
          :disabled="!mergeStore.allResolved"
          @click="finishMerge"
        >
          完成合并
        </button>
      </div>
    </div>

    <!-- 合并成功 -->
    <div v-else-if="mergeStore.mergeResult?.success" class="merge-result success">
      <div class="result-icon">✓</div>
      <h2>合并成功</h2>
      <p>已成功合并，可以继续提交。</p>
      <button class="btn btn-primary" @click="goToDashboard">返回仪表盘</button>
    </div>

    <!-- 合并失败 -->
    <div v-else-if="mergeStore.mergeResult?.error" class="merge-result error">
      <div class="result-icon">✗</div>
      <h2>合并失败</h2>
      <p>{{ mergeStore.mergeResult.error }}</p>
      <button class="btn btn-primary" @click="reset">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGitStore } from '@/stores/git'
import { useMergeStore } from '@/stores/merge'

const router = useRouter()
const gitStore = useGitStore()
const mergeStore = useMergeStore()

const selectedBranch = ref('')
const editContent = ref('')

const otherBranches = computed(() =>
  gitStore.branches.filter((b) => !b.isRemote && b.name !== gitStore.currentBranch?.name)
)

watch(() => mergeStore.currentFile, (file) => {
  editContent.value = file?.resolved || file?.workingContent || ''
}, { immediate: true })

async function doMerge() {
  if (!selectedBranch.value) return
  await mergeStore.startMerge(gitStore.repoPath, selectedBranch.value)
  await gitStore.refreshAll()
}

async function useOurs() {
  if (!mergeStore.currentFile) return
  editContent.value = mergeStore.currentFile.ours
  mergeStore.updateResolvedContent(editContent.value)
}

async function useTheirs() {
  if (!mergeStore.currentFile) return
  editContent.value = mergeStore.currentFile.theirs
  mergeStore.updateResolvedContent(editContent.value)
}

async function markResolved() {
  if (!mergeStore.currentFile) return
  mergeStore.updateResolvedContent(editContent.value)
  await mergeStore.markResolved(gitStore.repoPath, mergeStore.currentFile.filePath)
  mergeStore.nextFile()
}

async function abortMerge() {
  await mergeStore.abortMerge(gitStore.repoPath)
}

async function finishMerge() {
  await mergeStore.completeMerge(gitStore.repoPath, `合并 ${selectedBranch.value} 到 ${gitStore.currentBranch?.name}`)
  await gitStore.refreshAll()
}

function reset() {
  mergeStore.reset()
  selectedBranch.value = ''
}

function goToDashboard() {
  mergeStore.reset()
  router.push('/dashboard')
}
</script>

<style scoped>
.merge-view {
  padding: 16px;
  overflow: auto;
  height: 100%;
}

.view-header h1 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}

/* 合并表单 */
.merge-form {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  max-width: 480px;
}

.form-row {
  margin-bottom: 16px;
}

.form-row label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.current-branch-display {
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--accent);
  font-weight: 500;
}

.select {
  width: 100%;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
}

.select:focus {
  outline: none;
  border-color: var(--accent);
}

/* 冲突解决 */
.conflict-resolver {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  gap: 8px;
}

.conflict-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.conflict-header h2 {
  font-size: 15px;
  font-weight: 600;
}

.conflict-progress {
  font-size: 12px;
  color: var(--text-secondary);
}

.conflict-file-list {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 4px 0;
}

.conflict-file-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  white-space: nowrap;
}

.conflict-file-item.active {
  border-color: var(--accent);
  background: rgba(0, 120, 212, 0.1);
}

.conflict-file-item.resolved {
  opacity: 0.6;
}

.file-status-icon {
  font-size: 10px;
}

.conflict-file-item.resolved .file-status-icon {
  color: var(--success);
}

.conflict-file-item:not(.resolved) .file-status-icon {
  color: var(--error);
}

.conflict-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.editor-file {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.editor-actions {
  display: flex;
  gap: 4px;
}

.conflict-textarea {
  flex: 1;
  padding: 10px;
  background: var(--bg-primary);
  border: none;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 12px;
  resize: none;
  line-height: 1.5;
}

.conflict-textarea:focus {
  outline: none;
}

.conflict-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
}

/* 结果 */
.merge-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.merge-result.success .result-icon {
  color: var(--success);
}

.merge-result.error .result-icon {
  color: var(--error);
}

.merge-result h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.merge-result p {
  color: var(--text-secondary);
  margin-bottom: 20px;
  max-width: 400px;
}

.btn {
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary { background: var(--accent); color: white; }
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-cancel { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); }

.btn-sm {
  padding: 4px 10px;
  border-radius: 3px;
  font-size: 12px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-sm:hover { background: var(--bg-hover); }
</style>
