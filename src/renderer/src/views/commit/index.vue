<script setup lang="ts">
import { computed } from 'vue'
import { useRepositoryStore } from '@/stores/repository'

const repositoryStore = useRepositoryStore()
const summary = computed(() => repositoryStore.summary)
</script>

<template>
  <NCard title="提交工作台" :bordered="false">
    <NEmpty v-if="!summary" description="先打开仓库，再进入提交工作台" />
    <div v-else class="grid gap-4 lg:grid-cols-2">
      <NCard embedded title="已暂存文件" size="small">
        <NList bordered>
          <NListItem v-for="file in summary.stagedFiles" :key="file">
            {{ file }}
          </NListItem>
          <NListItem v-if="summary.stagedFiles.length === 0">暂无已暂存文件</NListItem>
        </NList>
      </NCard>
      <NCard embedded title="未暂存文件" size="small">
        <NList bordered>
          <NListItem v-for="file in [...summary.unstagedFiles, ...summary.untrackedFiles]" :key="file">
            {{ file }}
          </NListItem>
          <NListItem v-if="summary.unstagedFiles.length + summary.untrackedFiles.length === 0">工作区干净</NListItem>
        </NList>
      </NCard>
    </div>
  </NCard>
</template>
