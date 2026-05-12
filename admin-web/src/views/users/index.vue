<template>
  <div class="users-container">
    <el-table :data="users" v-loading="loading" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="头像" width="100">
        <template #default="{ row }">
          <el-avatar :src="row.avatar || '/default-avatar.png'" size="medium" />
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="role" label="角色">
        <template #default="{ row }">
          <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '正常' : '已封禁' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button 
            size="small" 
            :type="row.status === 'active' ? 'danger' : 'success'"
            @click="toggleUserStatus(row)"
          >
            {{ row.status === 'active' ? '封禁' : '解封' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const users = ref([])
const loading = ref(false)

const fetchUsers = async () => {
  loading.value = true
  try {
    users.value = await api.get('/admin/users')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const getRoleType = (role: string) => {
  const map: Record<string, string> = { user: 'info', merchant: 'primary', rider: 'warning', both: 'success', admin: 'danger' }
  return map[role] || 'info'
}

const getRoleText = (role: string) => {
  const map: Record<string, string> = { user: '普通用户', merchant: '商户', rider: '骑手', both: '商户+骑手', admin: '管理员' }
  return map[role] || role
}

const toggleUserStatus = async (row: any) => {
  const action = row.status === 'active' ? '封禁' : '解封'
  const newStatus = row.status === 'active' ? 'banned' : 'active'
  
  try {
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, '提示', { type: 'warning' })
    await api.put(`/admin/users/${row.id}/status`, { status: newStatus })
    ElMessage.success(`${action}成功`)
    fetchUsers()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
</style>
