<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRepositoryActions } from '@/composables/use-repository-actions'
import { useRepositoryStore } from '@/stores/repository'

const router = useRouter()
const repositoryStore = useRepositoryStore()
const { openingRepository, openRepository, removeRecentRepository } = useRepositoryActions()

const summary = computed(() => repositoryStore.summary)
const recentRepositories = computed(() => repositoryStore.recentRepositories)
const hasRepository = computed(() => repositoryStore.hasRepository)

const quickActions = [
  { label: '打开提交工作台', route: '/commit' },
  { label: '查看历史', route: '/history' },
  { label: '管理分支', route: '/branches' },
  { label: '处理合并', route: '/merge' },
]

onMounted(async () => {
  await repositoryStore.initialize()
})

async function handleRecentRepositoryClick(repoPath: string): Promise<void> {
  await openRepository(repoPath)
}

function formatTime(value: number): string {
  return new Date(value).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
    <NCard title="仓库入口" :bordered="false">
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <NButton type="primary" :loading="openingRepository" @click="openRepository()">
            打开仓库
          </NButton>
          <NButton quaternary @click="repositoryStore.loadRecentRepositories()">
            刷新最近记录
          </NButton>
        </div>

        <NEmpty v-if="!recentRepositories.length" description="还没有最近仓库记录" />

        <div v-else class="flex flex-col gap-3">
          <NCard
            v-for="item in recentRepositories"
            :key="item.path"
            embedded
            size="small"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold">
                  {{ item.name }}
                </div>
                <div class="text-xs mt-1 break-all text-[rgb(var(--base-text-color)/0.7)]">
                  {{ item.path }}
                </div>
                <div class="text-xs mt-2 text-[rgb(var(--base-text-color)/0.55)]">
                  最近打开：{{ formatTime(item.lastOpened) }}
                </div>
              </div>
              <div class="flex gap-2">
                <NButton size="small" type="primary" secondary @click="handleRecentRepositoryClick(item.path)">
                  打开
                </NButton>
                <NButton size="small" quaternary @click="removeRecentRepository(item.path)">
                  移除
                </NButton>
              </div>
            </div>
          </NCard>
        </div>
      </div>
    </NCard>

    <NCard title="仓库总览" :bordered="false">
      <NEmpty v-if="!hasRepository || !summary" description="打开 Git 仓库后会在这里展示摘要信息" />

      <div v-else class="flex flex-col gap-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <NStatistic label="当前分支" :value="summary.currentBranch || 'Detached HEAD'" />
          <NStatistic label="远程数量" :value="summary.remotes.length" />
          <NStatistic label="Ahead / Behind" :value="`${summary.ahead} / ${summary.behind}`" />
          <NStatistic label="Stash 数量" :value="summary.stashCount" />
        </div>

        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <NCard embedded size="small" title="已暂存">
            {{ summary.fileStats.staged }}
          </NCard>
          <NCard embedded size="small" title="未暂存">
            {{ summary.fileStats.unstaged }}
          </NCard>
          <NCard embedded size="small" title="未跟踪">
            {{ summary.fileStats.untracked }}
          </NCard>
          <NCard embedded size="small" title="冲突">
            {{ summary.fileStats.conflicted }}
          </NCard>
        </div>

        <NAlert v-if="summary.mergeInProgress" type="warning" title="检测到 merge 进行中">
          当前仓库存在未完成的合并流程。
        </NAlert>

        <div>
          <div class="text-sm mb-2 font-semibold">
            快速入口
          </div>
          <div class="flex flex-wrap gap-2">
            <NButton
              v-for="action in quickActions"
              :key="action.route"
              secondary
              type="primary"
              @click="router.push(action.route)"
            >
              {{ action.label }}
            </NButton>
          </div>
        </div>
      </div>
    </NCard>
  </div>
</template>
