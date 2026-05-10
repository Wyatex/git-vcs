<template>
  <header class="app-header">
    <div class="header-left">
      <span class="app-title">Git VCS</span>
      <span v-if="gitStore.repoPath" class="repo-indicator">
        {{ getRepoName() }}
      </span>
    </div>
    <div class="header-center">
      <div v-if="gitStore.isRepoLoaded" class="header-nav">
        <router-link to="/dashboard" class="nav-item">概览</router-link>
        <router-link to="/history" class="nav-item">历史</router-link>
        <router-link to="/branches" class="nav-item">分支</router-link>
        <router-link to="/tags" class="nav-item">标签</router-link>
        <router-link to="/merge" class="nav-item">合并</router-link>
      </div>
    </div>
    <div class="header-right">
      <button v-if="gitStore.repoPath" class="btn-icon" @click="closeRepo" title="关闭仓库">✕</button>
      <button class="btn-icon" @click="toggleTheme" title="切换主题">☀</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGitStore } from '@/stores/git'

const router = useRouter()
const gitStore = useGitStore()

function getRepoName(): string {
  const path = gitStore.repoPath
  if (!path) return ''
  const parts = path.split('\\')
  return parts[parts.length - 1] || parts[path.split('/').length - 1] || ''
}

function closeRepo() {
  gitStore.setRepoPath('')
  router.push('/')
}

function toggleTheme() {
  // TODO: 主题切换
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  height: var(--header-height);
  padding: 0 14px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  -webkit-app-region: drag;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
}

.app-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.repo-indicator {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-nav {
  display: flex;
  gap: 2px;
  -webkit-app-region: no-drag;
}

.nav-item {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.15s;
  text-decoration: none;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.router-link-active {
  background: var(--bg-active);
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  justify-content: flex-end;
}

.btn-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  -webkit-app-region: no-drag;
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
