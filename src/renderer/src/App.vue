<script setup lang="ts">
import { computed } from 'vue'
import { darkTheme } from 'naive-ui'
import { useThemeStore } from '@/stores/theme'

const { darkMode, naiveTheme } = useThemeStore()

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
