<template>
  <div class="tag-view">
    <div class="view-header">
      <h1>标签管理</h1>
      <div class="view-actions">
        <button class="btn btn-primary" @click="showCreateDialog = true">+ 新建标签</button>
        <button class="btn-icon" @click="refresh" title="刷新">↻</button>
      </div>
    </div>

    <div class="tag-section">
      <h2 class="section-title">所有标签（{{ gitStore.tags.length }}）</h2>
      <div v-if="gitStore.tags.length === 0" class="empty">暂无标签</div>
      <div v-else class="tag-table">
        <div class="tag-row header">
          <span class="col-name">名称</span>
          <span class="col-commit">提交</span>
          <span class="col-action">操作</span>
        </div>
        <div v-for="tag in gitStore.tags" :key="tag.name" class="tag-row">
          <span class="col-name">
            <span class="tag-icon">🏷</span>
            {{ tag.name }}
          </span>
          <span class="col-commit">{{ tag.commitHash?.substring(0, 8) || '-' }}</span>
          <span class="col-action">
            <button class="btn-sm btn-danger" @click="deleteTag(tag.name)">删除</button>
          </span>
        </div>
      </div>
    </div>

    <!-- 新建标签对话框 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog">
        <h2>新建标签</h2>
        <div class="dialog-body">
          <label>标签名称</label>
          <input v-model="newTagName" type="text" class="input" placeholder="输入标签名..." @keyup.enter="createTag" />
          <label>说明（可选）</label>
          <input v-model="newTagMessage" type="text" class="input" placeholder="标签说明..." />
        </div>
        <div class="dialog-actions">
          <button class="btn btn-cancel" @click="showCreateDialog = false">取消</button>
          <button class="btn btn-primary" @click="createTag" :disabled="!newTagName">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGitStore } from '@/stores/git'

const gitStore = useGitStore()

const showCreateDialog = ref(false)
const newTagName = ref('')
const newTagMessage = ref('')

async function createTag() {
  if (!newTagName.value) return
  await gitStore.createTag(newTagName.value, newTagMessage.value || undefined)
  newTagName.value = ''
  newTagMessage.value = ''
  showCreateDialog.value = false
}

async function deleteTag(name: string) {
  if (confirm(`确定删除标签 "${name}"？`)) {
    await gitStore.deleteTag(name)
  }
}

async function refresh() {
  await gitStore.loadTags()
}
</script>

<style scoped>
.tag-view {
  padding: 16px;
  overflow: auto;
  height: 100%;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.view-header h1 {
  font-size: 16px;
  font-weight: 600;
}

.view-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

.tag-table {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.tag-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
}

.tag-row:last-child { border-bottom: none; }
.tag-row:hover { background: var(--bg-hover); }
.tag-row.header { font-size: 11px; color: var(--text-muted); text-transform: uppercase; background: var(--bg-tertiary); }

.col-name { flex: 3; display: flex; align-items: center; gap: 6px; }
.col-commit { flex: 2; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
.col-action { flex: 1; }

.tag-icon { font-size: 14px; }

.btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary { background: var(--accent); color: white; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-cancel { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); }
.btn-sm { padding: 3px 8px; border-radius: 3px; font-size: 12px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); }
.btn-danger { color: var(--error); }
.btn-danger:hover { background: rgba(244, 71, 71, 0.1) !important; }
.btn-icon { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 4px; background: transparent; color: var(--text-secondary); font-size: 16px; }
.btn-icon:hover { background: var(--bg-hover); color: var(--text-primary); }

/* 对话框 */
.dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.dialog { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; min-width: 360px; }
.dialog h2 { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
.dialog-body label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; margin-top: 12px; }
.input { width: 100%; padding: 6px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); }
.input:focus { outline: none; border-color: var(--accent); }
.dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
</style>
