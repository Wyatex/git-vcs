<template>
  <aside class="w-[var(--sidebar-width)] min-w-[var(--sidebar-width)] bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col overflow-y-auto">
    <div class="px-2 py-2.5 border-b border-[var(--border-color)]">
      <h3 class="text-[11px] font-semibold text-[var(--text-muted)] uppercase px-2 pb-1.5 tracking-[0.5px]">仓库</h3>
      <div class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[var(--bg-hover)]" @click="openRepo">
        <span class="text-sm">📂</span>
        <span class="text-[13px] text-[var(--text-primary)] font-medium">{{ repoShortName }}</span>
      </div>
    </div>

    <div class="px-2 py-2.5 border-b border-[var(--border-color)]">
      <h3 class="text-[11px] font-semibold text-[var(--text-muted)] uppercase px-2 pb-1.5 tracking-[0.5px]">分支</h3>
      <div class="flex flex-col">
        <div
          v-for="branch in gitStore.branches.slice(0, 10)"
          :key="branch.name"
          class="flex items-center gap-1.5 px-2 py-1 rounded-sm cursor-pointer hover:bg-[var(--bg-hover)] [&.active]:bg-[rgba(0,120,212,0.12)]"
          :class="{ active: branch.isCurrent }"
          @click="switchBranch(branch.name)"
        >
          <span class="w-3.5 text-[11px] text-[var(--text-muted)] shrink-0" :class="{ 'text-[var(--success)]': branch.isCurrent }">
            {{ branch.isCurrent ? '✓' : '⎇' }}
          </span>
          <span class="flex-1 text-xs text-[var(--text-primary)] truncate">{{ branch.name.replace('remotes/origin/', '') }}</span>
          <span v-if="branch.ahead > 0" class="px-1 rounded-md text-[10px] text-[var(--success)] bg-[rgba(78,201,176,0.1)]">{{ branch.ahead }}</span>
        </div>
      </div>
    </div>

    <div class="px-2 py-2.5 border-b border-[var(--border-color)]">
      <h3 class="text-[11px] font-semibold text-[var(--text-muted)] uppercase px-2 pb-1.5 tracking-[0.5px]">标签</h3>
      <div class="flex flex-col">
        <div
          v-for="tag in gitStore.tags.slice(0, 10)"
          :key="tag.name"
          class="flex items-center gap-1.5 px-2 py-1 rounded-sm cursor-pointer hover:bg-[var(--bg-hover)]"
          @click="router.push('/tags')"
        >
          <span class="text-[11px] shrink-0">🏷</span>
          <span class="flex-1 text-xs text-[var(--text-primary)] truncate">{{ tag.name }}</span>
        </div>
      </div>
    </div>

    <div class="mt-auto border-t border-[var(--border-color)] py-1">
      <div class="flex items-center px-3.5 py-1.5 cursor-pointer text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]" @click="router.push('/merge')">
        <span>🔀 合并</span>
      </div>
      <div class="flex items-center px-3.5 py-1.5 cursor-pointer text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]" @click="fetchAll">
        <span>🔄 拉取</span>
      </div>
      <div class="flex items-center px-3.5 py-1.5 cursor-pointer text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]" @click="pushAll">
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
