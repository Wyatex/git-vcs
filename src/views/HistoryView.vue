<template>
  <div class="history-view">
    <div class="view-header">
      <h1>提交历史</h1>
      <div class="view-actions">
        <button class="btn-icon" @click="refresh" title="刷新">↻</button>
      </div>
    </div>

    <div class="metro-area">
      <canvas ref="metroCanvas" class="metro-canvas"></canvas>
      <div class="commit-list-panel">
        <div v-if="gitStore.loading" class="loading">加载中...</div>
        <div v-else-if="gitStore.commits.length === 0" class="empty">无提交记录</div>
        <div v-else class="commit-list-scroll" @scroll="onCommitListScroll">
          <div
            v-for="(commit, index) in gitStore.commits"
            :key="commit.hash"
            class="commit-item"
            :class="{ selected: selectedCommit?.hash === commit.hash }"
            @click="selectCommit(commit)"
          >
            <div class="metro-indicator" :style="{ backgroundColor: getBranchColor(index) }"></div>
            <div class="commit-header">
              <span class="commit-hash">{{ commit.hash.substring(0, 7) }}</span>
              <span class="commit-date">{{ formatDate(commit.date) }}</span>
            </div>
            <div class="commit-message">{{ commit.message }}</div>
            <div class="commit-meta">
              <span>{{ commit.authorName }}</span>
              <span v-if="commit.parents.length > 1" class="merge-badge">merge</span>
              <span v-if="getRefs(commit).length > 0" class="refs">{{ getRefs(commit).join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 提交详情面板 -->
    <div v-if="selectedCommit" class="commit-detail-panel">
      <div class="detail-header">
        <h2>提交详情</h2>
        <button class="btn-icon" @click="selectedCommit = null">×</button>
      </div>
      <div class="detail-body">
        <div class="detail-row">
          <span class="detail-label">Hash</span>
          <code class="detail-value">{{ selectedCommit.hash }}</code>
        </div>
        <div class="detail-row">
          <span class="detail-label">作者</span>
          <span class="detail-value">{{ selectedCommit.authorName }} ({{ selectedCommit.authorEmail }})</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">日期</span>
          <span class="detail-value">{{ formatDate(selectedCommit.date) }}</span>
        </div>
        <div class="detail-message">
          <strong>提交信息</strong>
          <p>{{ selectedCommit.message }}</p>
          <p v-if="selectedCommit.body" class="body-text">{{ selectedCommit.body }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useGitStore } from '@/stores/git'
import type { Commit } from '@/types/git'

const gitStore = useGitStore()
const selectedCommit = ref<Commit | null>(null)
const metroCanvas = ref<HTMLCanvasElement | null>(null)

const BRANCH_COLORS = [
  '#4ec9b0', '#dcdcaa', '#569cd6', '#c586c0',
  '#d16969', '#6a9955', '#808080', '#b5cea8',
  '#ce9178', '#6796e6'
]

function getBranchColor(index: number): string {
  return BRANCH_COLORS[index % BRANCH_COLORS.length]
}

function getRefs(commit: Commit): string[] {
  const refs: string[] = []
  for (const branch of gitStore.branches) {
    if (branch.commitHash?.startsWith(commit.hash)) {
      refs.push(branch.name)
    }
  }
  return refs
}

function selectCommit(commit: Commit) {
  selectedCommit.value = selectedCommit.value?.hash === commit.hash ? null : commit
}

function onCommitListScroll(event: Event) {
  // TODO: 同步地铁图滚动
}

function refresh() {
  gitStore.loadCommits(200)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.history-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.view-header h1 {
  font-size: 16px;
  font-weight: 600;
}

.metro-area {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.metro-canvas {
  width: 80px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
}

.commit-list-panel {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.commit-list-scroll {
  flex: 1;
  overflow-y: auto;
}

.commit-item {
  padding: 10px 12px;
  padding-left: 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  position: relative;
}

.commit-item:hover {
  background: var(--bg-hover);
}

.commit-item.selected {
  background: var(--bg-active);
}

.metro-indicator {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.commit-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.commit-hash {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.commit-date {
  font-size: 11px;
  color: var(--text-muted);
}

.commit-message {
  font-size: 13px;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commit-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
}

.merge-badge {
  padding: 0 4px;
  border-radius: 3px;
  background: rgba(197, 134, 192, 0.2);
  color: #c586c0;
  font-weight: 500;
}

.refs {
  color: var(--accent);
}

.loading, .empty {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

/* 提交详情面板 */
.commit-detail-panel {
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color);
}

.detail-header h2 {
  font-size: 13px;
  font-weight: 600;
}

.detail-body {
  padding: 12px 16px;
}

.detail-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.detail-label {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
  width: 50px;
}

.detail-value {
  font-size: 12px;
  color: var(--text-primary);
  word-break: break-all;
}

.detail-value code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
}

.detail-message {
  margin-top: 8px;
}

.detail-message strong {
  font-size: 12px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 4px;
}

.detail-message p {
  font-size: 13px;
  color: var(--text-primary);
}

.body-text {
  color: var(--text-secondary) !important;
}

.btn-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
