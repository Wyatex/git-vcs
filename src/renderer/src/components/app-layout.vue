<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRepositoryActions } from '@/composables/use-repository-actions'
import { useRepositoryStore } from '@/stores/repository'

const route = useRoute()
const router = useRouter()
const repositoryStore = useRepositoryStore()
const { openingRepository, openRepository } = useRepositoryActions()

const navItems = [
  { label: '总览', key: '/overview' },
  { label: '提交', key: '/commit' },
  { label: '分支', key: '/branches' },
  { label: '标签', key: '/tags' },
  { label: 'Stash', key: '/stash' },
  { label: '历史', key: '/history' },
  { label: 'Merge', key: '/merge' },
]

const activeKey = computed(() => route.path)
const summary = computed(() => repositoryStore.summary)
const repoName = computed(() => summary.value?.repoName ?? '未打开仓库')

onMounted(async () => {
  await repositoryStore.initialize()
})

function handleMenuSelect(key: string): void {
  router.push(key)
}
</script>

<template>
  <div class="h-full flex flex-col bg-container">
    <header class="bg-layout px-5 py-3 shadow-header">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="text-lg font-semibold">
            Git VCS Desktop Tool
          </div>
          <div class="text-sm mt-1 flex flex-wrap items-center gap-2 text-[rgb(var(--base-text-color)/0.7)]">
            <span>{{ repoName }}</span>
            <NTag v-if="summary?.currentBranch" size="small" type="primary" round>
              {{ summary.currentBranch }}
            </NTag>
            <NTag v-if="summary?.mergeInProgress" size="small" type="warning" round>
              Merge In Progress
            </NTag>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <NButton secondary :loading="repositoryStore.loading" @click="repositoryStore.refreshRepository()">
            刷新
          </NButton>
          <NButton type="primary" :loading="openingRepository" @click="openRepository()">
            打开仓库
          </NButton>
        </div>
      </div>
    </header>

    <div class="min-h-0 flex flex-1 overflow-hidden">
      <aside class="w-66 bg-layout p-3 shadow-sider">
        <NMenu :value="activeKey" :options="navItems" @update:value="handleMenuSelect" />
      </aside>

      <main class="min-w-0 flex-1 overflow-auto p-5">
        <router-view />
      </main>

      <aside class="hidden w-80 bg-layout p-4 shadow-sider xl:block">
        <NCard title="仓库摘要" :bordered="false" size="small">
          <NEmpty v-if="!summary" description="打开仓库后显示摘要" />
          <div v-else class="text-sm flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span>远程</span>
              <strong>{{ summary.remotes.length }}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span>Ahead</span>
              <strong>{{ summary.ahead }}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span>Behind</span>
              <strong>{{ summary.behind }}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span>Stash</span>
              <strong>{{ summary.stashCount }}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span>冲突文件</span>
              <strong>{{ summary.fileStats.conflicted }}</strong>
            </div>
          </div>
        </NCard>
      </aside>
    </div>
  </div>
</template>
