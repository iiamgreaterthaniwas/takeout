<template>
  <div class="settings-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>平台抽成设置</span>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </div>
      </template>
      
      <el-form :model="settings" label-width="120px" v-loading="loading">
        <el-form-item label="商品抽成比例">
          <el-input-number v-model="settings.productRate" :min="0" :max="100" :precision="2" :step="0.1" />
          <span class="unit">%</span>
          <div class="help-text">商户营业额中，平台抽取的百分比</div>
        </el-form-item>
        
        <el-form-item label="运费抽成比例">
          <el-input-number v-model="settings.deliveryRate" :min="0" :max="100" :precision="2" :step="0.1" />
          <span class="unit">%</span>
          <div class="help-text">骑手配送费中，平台抽取的百分比</div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const settings = ref({
  productRate: 5.0,
  deliveryRate: 10.0,
  baseDeliveryFee: 5.0
})

const fetchSettings = async () => {
  loading.value = true
  try {
    const res: any = await api.get('/admin/settings')
    if (res) {
      settings.value = res
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  loading.value = true
  try {
    await api.post('/admin/settings', settings.value)
    ElMessage.success('保存成功')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.settings-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.unit {
  margin-left: 10px;
}
.help-text {
  font-size: 12px;
  color: #999;
  margin-left: 15px;
}
</style>
