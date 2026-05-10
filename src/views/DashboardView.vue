<template>
  <div class="dashboard-view">
    <!-- 仓库概览栏 -->
    <div class="repo-bar">
      <div class="repo-info">
        <span class="repo-label">仓库</span>
        <span class="repo-name">{{ repoShortName }}</span>
        <span class="repo-path">{{ gitStore.repoPath }}</span>
      </div>
      <div class="branch-info">
        <span class="label">分支</span>
        <span class="value">{{ gitStore.currentBranch?.name }}</span>
      </div>
      <div class="sync-info" v-if="gitStore.status">
        <span class="sync-badge" v-if="gitStore.status.ahead > 0">↑ {{ gitStore.status.ahead }}</span>
        <span class="sync-badge" v-if="gitStore.status.behind > 0">↓ {{ gitStore.status.behind }}</span>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- 文件变更面板 -->
      <div class="panel changes-panel">
        <div class="panel-header">
          <h2>变更</h2>
          <div class="panel-actions">
            <button class="btn-icon" @click="stageAll" title="暂存所有变更">+</button>
            <button class="btn-icon" @click="refresh" title="刷新">↻</button>
          </div>
        </div>
        <div class="panel-body">
          <div v-if="gitStore.loading" class="loading">加载中...</div>
          <div v-else-if="gitStore.fileChanges.length === 0" class="empty">无文件变更</div>
          <div v-else class="file-list">
            <!-- 暂存的文件 -->
            <div v-if="gitStore.stagedFiles.length > 0" class="file-group">
              <div class="file-group-title">已暂存</div>
              <div
                v-for="file in gitStore.stagedFiles"
                :key="file.path"
                class="file-item"
                :class="{ selected: selectedFile === file.path }"
                @click="selectFile(file.path)"
              >
                <span class="file-status" :class="statusClass(file.index)">{{ statusLabel(file.index) }}</span>
                <span class="file-path">{{ file.path }}</span>
                <button class="btn-unstage" @click.stop="unstageFile(file.path)">−</button>
              </div>
            </div>
            <!-- 未暂存的文件 -->
            <div v-if="gitStore.unstagedFiles.length > 0" class="file-group">
              <div class="file-group-title">未暂存</div>
              <div
                v-for="file in gitStore.unstagedFiles"
                :key="file.path"
                class="file-item"
                :class="{ selected: selectedFile === file.path }"
                @click="selectFile(file.path)"
              >
                <span class="file-status" :class="statusClass(file.working_dir)">{{ statusLabel(file.working_dir) }}</span>
                <span class="file-path">{{ file.path }}</span>
                <button class="btn-stage" @click.stop="stageFile(file.path)">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 提交输入面板 -->
      <div class="panel commit-panel">
        <div class="panel-header">
          <h2>提交</h2>
        </div>
        <div class="panel-body">
          <textarea
            v-model="commitMessage"
            class="commit-message-input"
            placeholder="输入提交信息..."
            rows="3"
          ></textarea>
          <div class="commit-actions">
            <button
              class="btn btn-primary"
              :disabled="!commitMessage || gitStore.stagedFiles.length === 0"
              @click="doCommit"
            >
              提交（{{ gitStore.stagedFiles.length }} 个文件）
            </button>
          </div>
        </div>
      </div>

      <!-- 最近提交面板 -->
      <div class="panel recent-panel">
        <div class="panel-header">
          <h2>最近提交</h2>
          <router-link to="/history" class="btn-link">查看全部 →</router-link>
        </div>
        <div class="panel-body">
          <div v-if="gitStore.loading" class="loading">加载中...</div>
          <div v-else-if="gitStore.commits.length === 0" class="empty">无提交记录</div>
          <div v-else class="commit-list">
            <div
              v-for="commit in gitStore.commits.slice(0, 10)"
              :key="commit.hash"
              class="commit-item"
              @click="router.push('/history')"
            >
              <div class="commit-hash">{{ commit.hash.substring(0, 8) }}</div>
              <div class="commit-msg">{{ commit.message }}</div>
              <div class="commit-meta">
                <span class="commit-author">{{ commit.authorName }}</span>
                <span class="commit-date">{{ formatDate(commit.date) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前分支面板 -->
      <div class="panel branch-panel">
        <div class="panel-header">
          <h2>分支</h2>
          <router-link to="/branches" class="btn-link">管理 →</router-link>
        </div>
        <div class="panel-body">
          <div class="branch-list">
            <div
              v-for="branch in gitStore.branches.slice(0, 8)"
              :key="branch.name"
              class="branch-item"
              :class="{ current: branch.isCurrent }"
              @click="switchBranch(branch.name)"
            >
              <span class="branch-icon">{{ branch.isCurrent ? '✓' : '⎇' }}</span>
              <span class="branch-name">{{ branch.name.replace('remotes/origin/', '') }}</span>
              <span v-if="branch.isCurrent" class="current-badge">当前</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGitStore } from '@/stores/git'

const router = useRouter()
const gitStore = useGitStore()

const commitMessage = ref('')
const selectedFile = ref<string>('')

const repoShortName = computed(() => {
  const path = gitStore.repoPath
  if (!path) return ''
  return path.split('\\').pop() || path.split('/').pop() || ''
})

function statusClass(status: string): string {
  if (status === 'M' || status === 'A') return 'modified'
  if (status === 'D') return 'deleted'
  if (status === 'R') return 'renamed'
  if (status === 'U') return 'unmerged'
  if (status === '?') return 'untracked'
  return ''
}

function statusLabel(status: string): string {
  if (status === 'M') return 'M'
  if (status === 'A') return 'A'
  if (status === 'D') return 'D'
  if (status === 'R') return 'R'
  if (status === 'U') return 'U'
  if (status === '?') return '?'
  return status
}

function selectFile(path: string) {
  selectedFile.value = selectedFile.value === path ? '' : path
}

async function stageFile(path: string) {
  await gitStore.addFiles([path])
}

async function unstageFile(path: string) {
  // TODO: 取消暂存
}

async function stageAll() {
  await gitStore.stageAll()
}

async function doCommit() {
  if (!commitMessage.value || gitStore.stagedFiles.length === 0) return
  await gitStore.commit(commitMessage.value)
  commitMessage.value = ''
}

async function switchBranch(name: string) {
  if (!gitStore.currentBranch || name === gitStore.currentBranch.name) return
  await gitStore.checkout(name)
}

async function refresh() {
  await gitStore.refreshAll()
}

function formatDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.dashboard-view {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 仓库信息栏 */
.repo-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.repo-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.repo-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.repo-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.repo-path {
  font-size: 11px;
  color: var(--text-muted);
}

.branch-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.branch-info .label {
  font-size: 11px;
  color: var(--text-muted);
}

.branch-info .value {
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
}

.sync-info {
  display: flex;
  gap: 6px;
}

.sync-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

/* 网格布局 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 16px;
  flex: 1;
  overflow: auto;
}

.changes-panel {
  grid-row: 1 / 3;
}

.panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h2 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-actions {
  display: flex;
  gap: 4px;
}

.panel-body {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

/* 文件列表 */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-group-title {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  padding: 4px 8px;
  text-transform: uppercase;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}

.file-item:hover {
  background: var(--bg-hover);
}

.file-item.selected {
  background: var(--bg-active);
}

.file-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.file-status.modified { color: var(--warning); background: rgba(220, 220, 170, 0.1); }
.file-status.deleted { color: var(--error); background: rgba(244, 71, 71, 0.1); }
.file-status.untracked { color: var(--text-muted); background: transparent; }
.file-status.renamed { color: var(--accent); background: rgba(0, 120, 212, 0.1); }

.file-path {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-stage, .btn-unstage {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.15s;
  background: transparent;
  color: var(--text-secondary);
}

.file-item:hover .btn-stage,
.file-item:hover .btn-unstage {
  opacity: 1;
}

.btn-stage:hover,
.btn-unstage:hover {
  background: var(--bg-active);
  color: var(--text-primary);
}

/* 提交 */
.commit-message-input {
  width: 100%;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  resize: none;
  margin-bottom: 8px;
}

.commit-message-input:focus {
  outline: none;
  border-color: var(--accent);
}

.commit-actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-link {
  font-size: 12px;
  color: var(--accent);
}

/* 提交列表 */
.commit-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.commit-item {
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.commit-item:hover {
  background: var(--bg-hover);
}

.commit-hash {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.commit-msg {
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.commit-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-muted);
}

/* 分支列表 */
.branch-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.branch-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.branch-item:hover {
  background: var(--bg-hover);
}

.branch-item.current {
  background: rgba(0, 120, 212, 0.1);
}

.branch-icon {
  width: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.branch-item.current .branch-icon {
  color: var(--success);
}

.branch-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}

.current-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--accent);
  color: white;
}

.loading, .empty {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.btn-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
