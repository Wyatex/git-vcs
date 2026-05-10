<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <h3 class="section-title">仓库</h3>
      <div class="repo-selector" @click="openRepo">
        <span class="repo-icon">📂</span>
        <span class="repo-name">{{ repoShortName }}</span>
      </div>
    </div>

    <div class="sidebar-section">
      <h3 class="section-title">分支</h3>
      <div class="section-list">
        <div
          v-for="branch in gitStore.branches.slice(0, 10)"
          :key="branch.name"
          class="list-item"
          :class="{ active: branch.isCurrent }"
          @click="switchBranch(branch.name)"
        >
          <span class="branch-indicator" :class="{ current: branch.isCurrent }">
            {{ branch.isCurrent ? '✓' : '⎇' }}
          </span>
          <span class="item-text">{{ branch.name.replace('remotes/origin/', '') }}</span>
          <span v-if="branch.ahead > 0" class="ahead-badge">{{ branch.ahead }}</span>
        </div>
      </div>
    </div>

    <div class="sidebar-section">
      <h3 class="section-title">标签</h3>
      <div class="section-list">
        <div
          v-for="tag in gitStore.tags.slice(0, 10)"
          :key="tag.name"
          class="list-item"
          @click="router.push('/tags')"
        >
          <span class="tag-indicator">🏷</span>
          <span class="item-text">{{ tag.name }}</span>
        </div>
      </div>
    </div>

    <div class="sidebar-bottom">
      <div class="bottom-item" @click="router.push('/merge')">
        <span>🔀 合并</span>
      </div>
      <div class="bottom-item" @click="fetchAll">
        <span>🔄 拉取</span>
      </div>
      <div class="bottom-item" @click="pushAll">
        <span>⬆ 推送</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGitStore } from '@/stores/git'
import { useDirectoryStore } from '@/stores/directory'

const router = useRouter()
const gitStore = useGitStore()
const directoryStore = useDirectoryStore()

const repoShortName = computed(() => {
  const path = gitStore.repoPath
  if (!path) return ''
  const sep = path.includes('\\') ? '\\' : '/'
  const parts = path.split(sep)
  return parts[parts.length - 1]
})

async function openRepo() {
  const path = await directoryStore.selectDirectory()
  if (path) {
    gitStore.setRepoPath(path)
    await gitStore.refreshAll()
    router.push('/dashboard')
  }
}

async function switchBranch(name: string) {
  if (gitStore.currentBranch?.name === name) return
  await gitStore.checkout(name)
}

async function fetchAll() {
  // TODO: fetch
}

async function pushAll() {
  // TODO: push
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-section {
  padding: 10px 8px;
  border-bottom: 1px solid var(--border-color);
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  padding: 0 8px 6px;
  letter-spacing: 0.5px;
}

.repo-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.repo-selector:hover {
  background: var(--bg-hover);
}

.repo-icon {
  font-size: 14px;
}

.repo-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.section-list {
  display: flex;
  flex-direction: column;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
}

.list-item:hover {
  background: var(--bg-hover);
}

.list-item.active {
  background: rgba(0, 120, 212, 0.12);
}

.branch-indicator {
  width: 14px;
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.branch-indicator.current {
  color: var(--success);
}

.tag-indicator {
  font-size: 11px;
  flex-shrink: 0;
}

.item-text {
  flex: 1;
  font-size: 12px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ahead-badge {
  padding: 0 4px;
  border-radius: 6px;
  font-size: 10px;
  color: var(--success);
  background: rgba(78, 201, 176, 0.1);
}

/* 底部操作 */
.sidebar-bottom {
  margin-top: auto;
  border-top: 1px solid var(--border-color);
  padding: 4px 0;
}

.bottom-item {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary);
}

.bottom-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
