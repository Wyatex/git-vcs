<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRepositoryStore } from '@/stores/repository'
import type { BranchSummary } from '../../../../shared/git'

const repositoryStore = useRepositoryStore()

// 状态定义
const branches = ref<BranchSummary[]>([])
const loading = ref(false)
const searchQuery = ref('')

// 新建分支弹窗状态
const showCreateModal = ref(false)
const creating = ref(false)
const newBranchName = ref('')
const newBranchStartPoint = ref('')
const checkoutAfterCreate = ref(true)

// 记录展开的文件夹 ID (默认折叠)
const expandedFolders = ref<Set<string>>(new Set())

interface TreeNode {
  id: string
  name: string
  isFolder: boolean
  depth: number
  branch?: BranchSummary
  children: TreeNode[]
}

// 切换文件夹展开/折叠
function toggleFolder(folderId: string) {
  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId)
  }
  else {
    expandedFolders.value.add(folderId)
  }
}

// 核心：计算树形节点（包含搜索、排序和树形转换）
const treeVisibleNodes = computed(() => {
  let list = branches.value

  // 1. 搜索过滤
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(b => b.name.toLowerCase().includes(q))
  }

  // 2. 构建树形结构
  const rootNodes: TreeNode[] = []

  list.forEach((branch) => {
    const parts = branch.name.split('/')
    let currentLevel = rootNodes
    let currentPath = ''

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      currentPath = currentPath ? `${currentPath}/${part}` : part

      // 为防止同名本地/远程文件夹冲突，ID 中加入标识
      const typePrefix = branch.remote ? 'remote' : 'local'
      const nodeId = `${typePrefix}:${isLast ? 'branch' : 'folder'}:${currentPath}`

      let node = currentLevel.find(n => n.id === nodeId)

      if (!node) {
        node = {
          id: nodeId,
          name: part,
          isFolder: !isLast,
          depth: index,
          branch: isLast ? branch : undefined,
          children: [],
        }
        currentLevel.push(node)
      }

      if (!isLast) {
        currentLevel = node.children
      }
    })
  })

  // 3. 树节点排序
  function sortNodes(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      // 当前分支永远在最前
      if (a.branch?.current && !b.branch?.current)
        return -1
      if (!a.branch?.current && b.branch?.current)
        return 1

      // 文件夹排在前面
      if (a.isFolder && !b.isFolder)
        return -1
      if (!a.isFolder && b.isFolder)
        return 1

      // 本地排在远程前面
      const aRemote = a.id.startsWith('remote')
      const bRemote = b.id.startsWith('remote')
      if (!aRemote && bRemote)
        return -1
      if (aRemote && !bRemote)
        return 1

      // 最后按字母排序
      return a.name.localeCompare(b.name)
    })
    nodes.forEach((n) => {
      if (n.isFolder)
        sortNodes(n.children)
    })
  }
  sortNodes(rootNodes)

  // 4. 将树扁平化以供列表渲染（处理展开/收缩状态）
  const result: TreeNode[] = []
  function flatten(nodes: TreeNode[]) {
    nodes.forEach((node) => {
      result.push(node)
      // 如果处于搜索状态，强制展开所有匹配到的父文件夹
      const isExpanded = expandedFolders.value.has(node.id) || searchQuery.value !== ''
      if (node.isFolder && isExpanded) {
        flatten(node.children)
      }
    })
  }
  flatten(rootNodes)

  return result
})

// 为新建分支弹窗保留的扁平下拉列表
const branchOptions = computed(() => {
  return branches.value.map(b => ({
    label: b.current ? `${b.name} (当前)` : b.name,
    value: b.name,
  }))
})

// 初始化与加载
async function loadBranches() {
  if (!repositoryStore.repoPath)
    return
  loading.value = true
  try {
    branches.value = await window.api.getBranches(repositoryStore.repoPath)
  }
  catch (error) {
    console.error('Failed to load branches:', error)
    window.$message?.error('获取分支列表失败')
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  if (repositoryStore.repoPath) {
    loadBranches()
  }
})

// 监听仓库状态更新，随时同步分支列表
watch(() => repositoryStore.repoPath, (newPath) => {
  if (newPath) {
    loadBranches()
  }
  else {
    branches.value = []
  }
})

// 切换分支
async function handleCheckout(branch: BranchSummary) {
  if (branch.current || !repositoryStore.repoPath)
    return

  try {
    const refName = branch.remote ? branch.name.replace(/^[^/]+\//, '') : branch.name
    await window.api.checkout(repositoryStore.repoPath, refName)
    window.$message?.success(`已切换到分支 ${refName}`)
    await refreshAll()
  }
  catch (error) {
    console.error(error)
    window.$message?.error(`切换分支失败，请确保工作区干净`)
  }
}

// 删除分支
async function handleDelete(branch: BranchSummary) {
  if (branch.current || !repositoryStore.repoPath)
    return

  window.$dialog?.warning({
    title: '删除分支',
    content: `确定要删除分支 "${branch.name}" 吗？此操作不可逆转。`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await window.api.deleteBranch(repositoryStore.repoPath!, branch.name, false)
        window.$message?.success('删除成功')
        await loadBranches()
      }
      catch (error) {
        console.error(error)
        window.$message?.error('删除失败，可能包含未合并的提交。你可以尝试强制删除。')
      }
    },
  })
}

// 打开新建分支弹窗
function openCreateModal() {
  newBranchName.value = ''
  const currentBranch = branches.value.find(b => b.current)
  newBranchStartPoint.value = currentBranch?.name || ''
  checkoutAfterCreate.value = true
  showCreateModal.value = true
}

// 提交新建分支
async function handleCreateBranch() {
  if (!newBranchName.value.trim()) {
    window.$message?.warning('请输入新分支名称')
    return
  }

  creating.value = true
  try {
    await window.api.createBranch(
      repositoryStore.repoPath!,
      newBranchName.value.trim(),
      newBranchStartPoint.value === branches.value.find(b => b.current)?.name ? undefined : newBranchStartPoint.value,
      checkoutAfterCreate.value,
    )
    if (checkoutAfterCreate.value) {
      window.$message?.success(`成功创建并切换到分支 ${newBranchName.value}`)
    }
    else {
      window.$message?.success(`成功创建分支 ${newBranchName.value}`)
    }
    showCreateModal.value = false
    await refreshAll()
  }
  catch (error) {
    console.error(error)
    window.$message?.error('创建分支失败，可能是分支名不合法或已存在')
  }
  finally {
    creating.value = false
  }
}

// 刷新全部状态
async function refreshAll() {
  await loadBranches()
  await repositoryStore.refreshRepository()
}
</script>

<template>
  <NCard title="分支管理" :bordered="false" class="h-full flex flex-col">
    <!-- 只有在已打开仓库的情况下，才展示右上角的操作区（搜索、新建、刷新） -->
    <template v-if="repositoryStore.repoPath" #header-extra>
      <div class="flex gap-3">
        <NInput
          v-model:value="searchQuery"
          placeholder="搜索分支..."
          clearable
          class="w-64"
        />
        <NButton type="primary" @click="openCreateModal">
          新建分支
        </NButton>
        <NButton quaternary :loading="loading" @click="refreshAll">
          刷新
        </NButton>
      </div>
    </template>

    <!-- 核心判断 1：未打开仓库时展示空状态 -->
    <NEmpty v-if="!repositoryStore.repoPath" description="请先打开一个 Git 仓库" />

    <!-- 核心判断 2：有打开仓库后，渲染分支树列表主区域 -->
    <div v-else class="h-[calc(100vh-200px)] flex flex-col">
      <NCard embedded size="small" class="flex flex-1 flex-col overflow-hidden" content-style="padding: 0;">
        <div class="h-full overflow-auto p-2">
          <NList hoverable clickable>
            <NListItem
              v-for="node in treeVisibleNodes"
              :key="node.id"
              class="border border-transparent rounded-md transition-colors"
              :class="{ 'bg-[rgba(24,160,88,0.08)] border-[rgba(24,160,88,0.2)]': node.branch?.current }"
              @click="node.isFolder ? toggleFolder(node.id) : null"
            >
              <div
                class="flex items-center justify-between py-1"
                :style="{ paddingLeft: `${node.depth * 1.5 + 0.5}rem`, paddingRight: '0.5rem' }"
              >
                <!-- === 文件夹节点 === -->
                <div v-if="node.isFolder" class="w-full flex cursor-pointer items-center gap-2 text-[var(--text-color-2)] transition-colors hover:text-primary">
                  <svg
                    class="h-4 w-4 transition-transform duration-200"
                    :class="{ 'rotate-90': expandedFolders.has(node.id) || searchQuery }"
                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                  </svg>
                  <span class="text-[15px] font-medium">{{ node.name }}</span>
                </div>

                <!-- === 分支节点 === -->
                <div v-else class="w-full flex items-center justify-between">
                  <div class="min-w-0 flex items-center gap-3">
                    <NTag
                      size="small"
                      :type="node.branch!.current ? 'success' : (node.branch!.remote ? 'default' : 'info')"
                      :bordered="false"
                    >
                      {{ node.branch!.current ? '当前' : (node.branch!.remote ? '远程' : '本地') }}
                    </NTag>

                    <span
                      class="truncate text-[15px] font-medium"
                      :class="{ 'text-[rgb(24,160,88)] font-bold': node.branch!.current }"
                      :title="node.branch!.name"
                    >
                      {{ node.name }}
                    </span>
                  </div>

                  <div class="flex shrink-0 gap-2">
                    <NButton
                      v-if="!node.branch!.current"
                      size="small"
                      secondary
                      type="primary"
                      @click.stop="handleCheckout(node.branch!)"
                    >
                      签出
                    </NButton>

                    <NButton
                      v-if="!node.branch!.current && !node.branch!.remote"
                      size="small"
                      quaternary
                      type="error"
                      @click.stop="handleDelete(node.branch!)"
                    >
                      删除
                    </NButton>
                  </div>
                </div>
              </div>
            </NListItem>

            <NListItem v-if="treeVisibleNodes.length === 0">
              <div class="py-10 text-center text-[rgb(var(--text-color-3))]">
                没有找到匹配的分支
              </div>
            </NListItem>
          </NList>
        </div>
      </NCard>
    </div>

    <!-- 新建分支弹窗保持不变 -->
    <NModal v-model:show="showCreateModal">
      <NCard
        style="width: 480px"
        title="新建分支"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">新分支名称</label>
            <NInput v-model:value="newBranchName" placeholder="例如: feature/login-page" @keyup.enter="handleCreateBranch" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">起点分支 (Start Point)</label>
            <NSelect
              v-model:value="newBranchStartPoint"
              :options="branchOptions"
              placeholder="选择派生起点"
              filterable
            />
          </div>

          <div class="flex items-center pt-1">
            <NCheckbox v-model:checked="checkoutAfterCreate">
              创建后立即签出到该分支
            </NCheckbox>
          </div>
        </div>

        <template #footer>
          <div class="mt-4 flex justify-end gap-3">
            <NButton @click="showCreateModal = false">
              取消
            </NButton>
            <NButton type="primary" :loading="creating" @click="handleCreateBranch">
              创建分支
            </NButton>
          </div>
        </template>
      </NCard>
    </NModal>
  </NCard>
</template>
