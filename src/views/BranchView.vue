<template>
  <div class="branch-view">
    <div class="view-header">
      <h1>分支管理</h1>
      <div class="view-actions">
        <button class="btn btn-primary" @click="showCreateDialog = true">+ 新建分支</button>
        <button class="btn-icon" @click="refresh" title="刷新">↻</button>
      </div>
    </div>

    <!-- 本地分支 -->
    <div class="branch-section">
      <h2 class="section-title">本地分支</h2>
      <div class="branch-table">
        <div class="branch-row header">
          <span class="col-name">名称</span>
          <span class="col-status">状态</span>
          <span class="col-commit">最新提交</span>
          <span class="col-sync">同步</span>
          <span class="col-action">操作</span>
        </div>
        <div
          v-for="branch in localBranches"
          :key="branch.name"
          class="branch-row"
          :class="{ current: branch.isCurrent }"
        >
          <span class="col-name">
            <span class="branch-icon">⎇</span>
            {{ branch.name }}
          </span>
          <span class="col-status">
            <span v-if="branch.isCurrent" class="badge current-badge">当前</span>
          </span>
          <span class="col-commit">{{ branch.commitHash?.substring(0, 8) || '-' }}</span>
          <span class="col-sync">
            <span v-if="branch.ahead > 0" class="sync-indicator ahead">↑{{ branch.ahead }}</span>
            <span v-if="branch.behind > 0" class="sync-indicator behind">↓{{ branch.behind }}</span>
          </span>
          <span class="col-action">
            <button class="btn-sm" @click="switchBranch(branch.name)" :disabled="branch.isCurrent">切换</button>
            <button class="btn-sm btn-danger" @click="deleteBranch(branch.name)" :disabled="branch.isCurrent">删除</button>
          </span>
        </div>
      </div>
    </div>

    <!-- 远程分支 -->
    <div class="branch-section">
      <h2 class="section-title">远程分支</h2>
      <div class="branch-table">
        <div class="branch-row header">
          <span class="col-name">名称</span>
          <span class="col-status">状态</span>
          <span class="col-commit">最新提交</span>
          <span class="col-action">操作</span>
        </div>
        <div v-for="branch in remoteBranches" :key="branch.name" class="branch-row">
          <span class="col-name">
            <span class="branch-icon remote">⬆</span>
            {{ branch.name.replace('remotes/origin/', '') }}
          </span>
          <span class="col-status">
            <span class="badge remote-badge">remote</span>
          </span>
          <span class="col-commit">{{ branch.commitHash?.substring(0, 8) || '-' }}</span>
          <span class="col-action">
            <button class="btn-sm" @click="checkoutRemote(branch.name)">检出</button>
          </span>
        </div>
      </div>
    </div>

    <!-- 新建分支对话框 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog">
        <h2>新建分支</h2>
        <div class="dialog-body">
          <label>分支名称</label>
          <input
            v-model="newBranchName"
            type="text"
            class="input"
            placeholder="输入分支名..."
            @keyup.enter="createBranch"
          />
          <label v-if="gitStore.currentBranch">基于</label>
          <select v-model="newBranchBase" class="input">
            <option :value="gitStore.currentBranch?.name">{{ gitStore.currentBranch?.name }}（当前分支）</option>
            <option v-for="b in gitStore.branches" :key="b.name" :value="b.name">{{ b.name }}</option>
          </select>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-cancel" @click="showCreateDialog = false">取消</button>
          <button class="btn btn-primary" @click="createBranch" :disabled="!newBranchName">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGitStore } from '@/stores/git'

const gitStore = useGitStore()

const showCreateDialog = ref(false)
const newBranchName = ref('')
const newBranchBase = ref('')

const localBranches = computed(() =>
  gitStore.branches.filter((b) => !b.isRemote)
)

const remoteBranches = computed(() =>
  gitStore.branches.filter((b) => b.isRemote)
)

async function switchBranch(name: string) {
  await gitStore.checkout(name)
}

async function deleteBranch(name: string) {
  if (confirm(`确定删除分支 "${name}"？`)) {
    await gitStore.deleteBranch(name)
  }
}

async function checkoutRemote(name: string) {
  const localName = name.replace('remotes/origin/', '')
  await gitStore.checkout(localName)
}

async function createBranch() {
  if (!newBranchName.value) return
  await gitStore.createBranch(newBranchName.value, newBranchBase.value || undefined)
  newBranchName.value = ''
  showCreateDialog.value = false
}

async function refresh() {
  await gitStore.loadBranches()
}
</script>

<style scoped>
.branch-view {
  padding: 16px;
  overflow: auto;
  height: 100%;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.view-header h1 {
  font-size: 16px;
  font-weight: 600;
}

.view-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.branch-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.branch-table {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.branch-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
}

.branch-row:last-child {
  border-bottom: none;
}

.branch-row:hover {
  background: var(--bg-hover);
}

.branch-row.current {
  background: rgba(0, 120, 212, 0.05);
}

.branch-row.header {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  background: var(--bg-tertiary);
}

.col-name { flex: 2; display: flex; align-items: center; gap: 6px; }
.col-status { flex: 1; }
.col-commit { flex: 1.5; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
.col-sync { flex: 1; display: flex; gap: 4px; }
.col-action { flex: 1.5; display: flex; gap: 4px; }

.branch-icon {
  font-size: 14px;
  color: var(--text-muted);
}

.branch-icon.remote {
  color: var(--accent);
}

.badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
}

.current-badge {
  background: var(--accent);
  color: white;
}

.remote-badge {
  background: var(--bg-tertiary);
  color: var(--text-muted);
}

.sync-indicator {
  padding: 0 4px;
  border-radius: 3px;
  font-size: 11px;
}

.sync-indicator.ahead { color: var(--success); }
.sync-indicator.behind { color: var(--warning); }

.btn-sm {
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 12px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-sm:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn-sm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-danger {
  color: var(--error);
}

.btn-danger:hover {
  background: rgba(244, 71, 71, 0.1) !important;
}

.btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-icon {
  width: 30px;
  height: 30px;
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

/* 对话框 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  min-width: 360px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.dialog h2 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
}

.dialog-body label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  margin-top: 12px;
}

.input {
  width: 100%;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
}

.input:focus {
  outline: none;
  border-color: var(--accent);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
