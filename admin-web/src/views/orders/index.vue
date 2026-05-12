<template>
  <div class="orders-container">
    <div class="header-actions">
      <el-select v-model="statusFilter" placeholder="订单状态" clearable @change="fetchOrders">
        <el-option label="待支付" value="pending_payment" />
        <el-option label="已支付" value="paid" />
        <el-option label="商户已接单" value="accepted" />
        <el-option label="待取餐" value="ready" />
        <el-option label="配送中" value="delivering" />
        <el-option label="已送达" value="delivered" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
        <el-option label="已退款" value="refunded" />
      </el-select>
    </div>

    <el-table :data="orders" v-loading="loading" border style="width: 100%; margin-top: 20px;">
      <el-table-column prop="id" label="订单号" width="80" />
      <el-table-column prop="user.nickname" label="下单用户" />
      <el-table-column prop="merchant.shopName" label="所属商户" />
      <el-table-column prop="totalAmount" label="总金额" />
      <el-table-column prop="deliveryFee" label="运费" />
      <el-table-column prop="address" label="配送地址" show-overflow-tooltip />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="dialogVisible" title="订单详情" width="50%">
      <div v-if="currentOrder">
        <el-descriptions border :column="2">
          <el-descriptions-item label="订单号">{{ currentOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(currentOrder.status) }}</el-descriptions-item>
          <el-descriptions-item label="下单用户">{{ currentOrder.user?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="所属商户">{{ currentOrder.merchant?.shopName }}</el-descriptions-item>
          <el-descriptions-item label="总金额">￥{{ currentOrder.totalAmount }}</el-descriptions-item>
          <el-descriptions-item label="运费">￥{{ currentOrder.deliveryFee }}</el-descriptions-item>
          <el-descriptions-item label="配送地址" :span="2">{{ currentOrder.address }} {{ currentOrder.addressDetail }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
        
        <h4 style="margin-top: 20px;">商品明细</h4>
        <el-table :data="currentOrder.items" border size="small">
          <el-table-column prop="productName" label="商品名称" />
          <el-table-column prop="unitPrice" label="单价" />
          <el-table-column prop="quantity" label="数量" />
          <el-table-column label="小计">
            <template #default="{ row }">
              ￥{{ (Number(row.unitPrice) * row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api'

const orders = ref([])
const loading = ref(false)
const statusFilter = ref('')
const dialogVisible = ref(false)
const currentOrder = ref<any>(null)

const fetchOrders = async () => {
  loading.value = true
  try {
    const url = statusFilter.value ? `/admin/orders?status=${statusFilter.value}` : '/admin/orders'
    orders.value = await api.get(url)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = { 
    pending_payment: 'info', 
    paid: 'primary',
    accepted: 'warning',
    ready: 'warning',
    delivering: 'primary',
    delivered: 'success',
    completed: 'success',
    cancelled: 'info',
    refunded: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = { 
    pending_payment: '待支付', 
    paid: '已支付',
    accepted: '已接单',
    ready: '待取餐',
    delivering: '配送中',
    delivered: '已送达',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return map[status] || status
}

const viewDetail = (row: any) => {
  currentOrder.value = row
  dialogVisible.value = true
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
.header-actions {
  display: flex;
  gap: 10px;
}
</style>
