<template>
  <div id="app-container">
    <AppHeader />
    <div id="main-area">
      <AppSidebar v-if="gitStore.isRepoLoaded" />
      <div id="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { useGitStore } from '@/stores/git'
import { useDirectoryStore } from '@/stores/directory'

const gitStore = useGitStore()
const directoryStore = useDirectoryStore()

onMounted(async () => {
  await directoryStore.loadRecent()
})
</script>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

#main-area {
  display: flex;
  flex: 1;
  overflow: hidden;
}

#content-area {
  flex: 1;
  overflow: auto;
  background: var(--bg-primary);
}
</style>
