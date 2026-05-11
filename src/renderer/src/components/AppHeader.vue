<template>
  <header class="flex items-center h-[var(--header-height)] px-3.5 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] select-none" style="-webkit-app-region: drag">
    <div class="flex items-center gap-2.5 min-w-[160px]">
      <span class="text-sm font-semibold text-[var(--text-primary)]">Git VCS</span>
      <span v-if="gitStore.repoPath" class="text-xs text-[var(--text-secondary)] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded">
        {{ getRepoName() }}
      </span>
    </div>
    <div class="flex-1 flex justify-center">
      <div v-if="gitStore.isRepoLoaded" class="flex gap-0.5" style="-webkit-app-region: no-drag">
        <router-link
          to="/dashboard"
          class="px-3 py-1.5 rounded text-[13px] text-[var(--text-secondary)] no-underline transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] [&.router-link-active]:bg-[var(--bg-active)] [&.router-link-active]:text-[var(--text-primary)]"
        >概览</router-link>
        <router-link
          to="/history"
          class="px-3 py-1.5 rounded text-[13px] text-[var(--text-secondary)] no-underline transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] [&.router-link-active]:bg-[var(--bg-active)] [&.router-link-active]:text-[var(--text-primary)]"
        >历史</router-link>
        <router-link
          to="/branches"
          class="px-3 py-1.5 rounded text-[13px] text-[var(--text-secondary)] no-underline transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] [&.router-link-active]:bg-[var(--bg-active)] [&.router-link-active]:text-[var(--text-primary)]"
        >分支</router-link>
        <router-link
          to="/tags"
          class="px-3 py-1.5 rounded text-[13px] text-[var(--text-secondary)] no-underline transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] [&.router-link-active]:bg-[var(--bg-active)] [&.router-link-active]:text-[var(--text-primary)]"
        >标签</router-link>
        <router-link
          to="/merge"
          class="px-3 py-1.5 rounded text-[13px] text-[var(--text-secondary)] no-underline transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] [&.router-link-active]:bg-[var(--bg-active)] [&.router-link-active]:text-[var(--text-primary)]"
        >合并</router-link>
      </div>
    </div>
    <div class="flex items-center gap-1 min-w-[60px] justify-end">
      <button
        v-if="gitStore.repoPath"
        class="w-7 h-7 flex items-center justify-center rounded bg-transparent text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        style="-webkit-app-region: no-drag"
        @click="closeRepo"
        title="关闭仓库"
      >✕</button>
      <button
        class="w-7 h-7 flex items-center justify-center rounded bg-transparent text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        style="-webkit-app-region: no-drag"
        @click="toggleTheme"
        title="切换主题"
      >☀</button>
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
