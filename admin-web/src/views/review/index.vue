<template>
  <div class="review-container">
    <el-tabs v-model="activeTab" class="review-tabs">
      <el-tab-pane label="商户入驻审核" name="merchant">
        <el-table :data="merchantApps" v-loading="loading" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="user.nickname" label="申请人" />
          <el-table-column prop="shopName" label="店铺名称" />
          <el-table-column prop="contactPhone" label="联系电话" />
          <el-table-column prop="address" label="店铺地址" />
          <el-table-column label="营业执照" width="120">
            <template #default="{ row }">
              <el-image 
                style="width: 50px; height: 50px" 
                :src="row.licenseImg" 
                :preview-src-list="[row.licenseImg]" 
                fit="cover" 
                v-if="row.licenseImg"
              />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="申请时间" width="180">
            <template #default="{ row }">
              {{ new Date(row.createdAt).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="success" v-if="row.status === 'pending'" @click="handleReview('merchant', row.id, 'approved')">通过</el-button>
              <el-button size="small" type="danger" v-if="row.status === 'pending'" @click="handleReview('merchant', row.id, 'rejected')">拒绝</el-button>
              <el-button size="small" type="warning" v-if="row.status === 'approved'" @click="handleReview('merchant', row.id, 'rejected')">下架</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="骑手入驻审核" name="rider">
        <el-table :data="riderApps" v-loading="loading" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="user.nickname" label="申请人" />
          <el-table-column prop="realName" label="真实姓名" />
          <el-table-column prop="idCard" label="身份证号" />
          <el-table-column prop="vehicleType" label="交通工具" />
          <el-table-column label="证件照" width="120">
            <template #default="{ row }">
              <el-image 
                style="width: 50px; height: 50px" 
                :src="row.idCardImg" 
                :preview-src-list="[row.idCardImg]" 
                fit="cover" 
                v-if="row.idCardImg"
              />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="申请时间" width="180">
            <template #default="{ row }">
              {{ new Date(row.createdAt).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="success" v-if="row.status === 'pending'" @click="handleReview('rider', row.id, 'approved')">通过</el-button>
              <el-button size="small" type="danger" v-if="row.status === 'pending'" @click="handleReview('rider', row.id, 'rejected')">拒绝</el-button>
              <el-button size="small" type="warning" v-if="row.status === 'approved'" @click="handleReview('rider', row.id, 'rejected')">下架</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="商品上架审核" name="product">
        <el-table :data="products" v-loading="loading" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="merchant.shopName" label="所属商户" />
          <el-table-column prop="name" label="商品名称" />
          <el-table-column prop="price" label="价格" />
          <el-table-column prop="stock" label="库存" />
          <el-table-column label="商品图片" width="120">
            <template #default="{ row }">
              <el-image 
                style="width: 50px; height: 50px" 
                :src="row.imageUrl" 
                :preview-src-list="[row.imageUrl]" 
                fit="cover" 
                v-if="row.imageUrl"
              />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getProductStatusType(row.status)">{{ getProductStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="提交时间" width="180">
            <template #default="{ row }">
              {{ new Date(row.createdAt).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="success" v-if="row.status === 'pending'" @click="handleProductReview(row.id, 'approved')">通过</el-button>
              <el-button size="small" type="danger" v-if="row.status === 'pending'" @click="handleProductReview(row.id, 'rejected')">拒绝</el-button>
              <el-button size="small" type="warning" v-if="row.status === 'approved'" @click="handleProductReview(row.id, 'off')">下架</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 拒绝原因对话框 -->
    <el-dialog v-model="dialogVisible" title="填写拒绝原因" width="30%">
      <el-input v-model="rejectReason" type="textarea" rows="3" placeholder="请输入拒绝原因（必填）" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmReject" :disabled="!rejectReason">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '../../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('merchant')
const loading = ref(false)

const merchantApps = ref([])
const riderApps = ref([])
const products = ref([])

const dialogVisible = ref(false)
const rejectReason = ref('')
const currentReview = ref({ type: '', id: 0 })

const fetchMerchantApps = async () => {
  loading.value = true
  try {
    merchantApps.value = await api.get('/applications/merchant')
  } finally {
    loading.value = false
  }
}

const fetchRiderApps = async () => {
  loading.value = true
  try {
    riderApps.value = await api.get('/applications/rider')
  } finally {
    loading.value = false
  }
}

const fetchProducts = async () => {
  loading.value = true
  try {
    products.value = await api.get('/products/admin')
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
  return map[status] || status
}

const getProductStatusType = (status: string) => {
  const map: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger', off: 'info' }
  return map[status] || 'info'
}

const getProductStatusText = (status: string) => {
  const map: Record<string, string> = { pending: '待审核', approved: '已上架', rejected: '已拒绝', off: '已下架' }
  return map[status] || status
}

const handleReview = async (type: string, id: number, status: string) => {
  if (status === 'rejected') {
    currentReview.value = { type, id }
    rejectReason.value = ''
    dialogVisible.value = true
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要通过该申请吗？', '提示', { type: 'warning' })
    await api.put(`/applications/${type}/${id}/review`, { status })
    ElMessage.success('审核通过成功')
    if (type === 'merchant') fetchMerchantApps()
    else fetchRiderApps()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const confirmReject = async () => {
  try {
    await api.put(`/applications/${currentReview.value.type}/${currentReview.value.id}/review`, { 
      status: 'rejected', 
      rejectReason: rejectReason.value 
    })
    ElMessage.success('已拒绝该申请')
    dialogVisible.value = false
    if (currentReview.value.type === 'merchant') fetchMerchantApps()
    else fetchRiderApps()
  } catch (e) {
    console.error(e)
  }
}

const handleProductReview = async (id: number, status: string) => {
  try {
    const actionName = status === 'approved' ? '通过' : (status === 'off' ? '下架' : '拒绝')
    await ElMessageBox.confirm(`确定要${actionName}该商品吗？`, '提示', { type: 'warning' })
    await api.put(`/products/admin/${id}/review`, { status })
    ElMessage.success(`操作成功`)
    fetchProducts()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

watch(activeTab, (val) => {
  if (val === 'merchant') fetchMerchantApps()
  else if (val === 'rider') fetchRiderApps()
  else if (val === 'product') fetchProducts()
})

onMounted(() => {
  fetchMerchantApps()
})
</script>

<style scoped>
.review-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
</style>
