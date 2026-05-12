<script setup lang="ts">
import { computed } from 'vue'
import { darkTheme } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const { darkMode, naiveTheme } = storeToRefs(themeStore)

const naiveDarkTheme = computed(() => (darkMode.value ? darkTheme : undefined))
</script>

<template>
  <NConfigProvider
    :theme="naiveDarkTheme"
    :theme-overrides="naiveTheme"
    class="h-full"
  >
    <AppProvider>
      <router-view />
    </AppProvider>
  </NConfigProvider>
</template>

<style scoped>
</style>
