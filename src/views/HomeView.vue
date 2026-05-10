<!-- ===== 目录选择页面 ===== -->
<template>
  <div class="home-view">
    <div class="home-container">
      <h1 class="title">Git VCS Tool</h1>
      <p class="subtitle">可视化 Git 仓库管理工具</p>

      <div class="actions">
        <button class="btn btn-primary" @click="openRepo">
          <span class="icon">📂</span>
          打开已有仓库
        </button>

        <button class="btn btn-secondary" @click="initRepo">
          <span class="icon">📁</span>
          初始化新仓库
        </button>

        <button class="btn btn-secondary" @click="cloneRepo">
          <span class="icon">📥</span>
          克隆远程仓库
        </button>
      </div>

      <!-- 最近仓库 -->
      <div v-if="directoryStore.recentDirectories.length > 0" class="recent-section">
        <h2 class="section-title">最近打开的仓库</h2>
        <div class="recent-list">
          <div
            v-for="dir in directoryStore.recentDirectories"
            :key="dir.path"
            class="recent-item"
            @click="openRecent(dir.path)"
          >
            <div class="repo-icon">📦</div>
            <div class="repo-info">
              <div class="repo-name">{{ dir.name }}</div>
              <div class="repo-path">{{ dir.path }}</div>
              <div class="repo-time">{{ formatTime(dir.lastOpened) }}</div>
            </div>
            <button class="btn-remove" @click.stop="removeDir(dir.path)" title="移除记录">×</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDirectoryStore } from '@/stores/directory'
import { useGitStore } from '@/stores/git'

const router = useRouter()
const directoryStore = useDirectoryStore()
const gitStore = useGitStore()

async function openRepo() {
  const path = await directoryStore.selectDirectory()
  if (path) {
    await loadRepo(path)
  }
}

async function initRepo() {
  // TODO: 实现初始化仓库
}

async function cloneRepo() {
  // TODO: 实现克隆仓库
}

async function openRecent(path: string) {
  await directoryStore.openDirectory(path)
  await loadRepo(path)
}

async function loadRepo(path: string) {
  gitStore.setRepoPath(path)
  try {
    await gitStore.refreshAll()
    router.push('/dashboard')
  } catch (e: any) {
    alert('无法打开仓库：' + e.message)
  }
}

function removeDir(path: string) {
  directoryStore.removeDirectory(path)
}

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return new Date(timestamp).toLocaleDateString()
}
</script>

<style scoped>
.home-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  background: var(--bg-primary);
}

.home-container {
  text-align: center;
  max-width: 500px;
  width: 90%;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 32px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.icon {
  font-size: 18px;
}

.recent-section {
  text-align: left;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.recent-item:hover {
  background: var(--bg-hover);
}

.repo-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.repo-info {
  flex: 1;
  min-width: 0;
}

.repo-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.repo-path {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.repo-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.btn-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.15s;
  background: transparent;
}

.recent-item:hover .btn-remove {
  opacity: 1;
}

.btn-remove:hover {
  background: var(--bg-active);
  color: var(--text-primary);
}
</style>
