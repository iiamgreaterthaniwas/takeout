<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card bg-blue">
          <div class="title">今日订单总数</div>
          <div class="value">{{ stats.todayOrders }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card bg-green">
          <div class="title">今日GMV (元)</div>
          <div class="value">￥{{ stats.todayGMV.toFixed(2) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card bg-orange">
          <div class="title">新增商户数</div>
          <div class="value">{{ stats.newMerchants }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card bg-purple">
          <div class="title">新增骑手数</div>
          <div class="value">{{ stats.newRiders }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">近7天订单趋势</div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="lineChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">平台角色分布</div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="pieChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import api from '../../api'

use([CanvasRenderer, LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const stats = ref({
  todayOrders: 0,
  todayGMV: 0,
  newMerchants: 0,
  newRiders: 0
})

const lineChartOption = ref({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value' },
  series: [{ data: [120, 200, 150, 80, 70, 110, 130], type: 'line', smooth: true }]
})

const pieChartOption = ref({
  tooltip: { trigger: 'item' },
  legend: { top: '5%', left: 'center' },
  series: [
    {
      name: '角色分布',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 40, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: 1048, name: '普通用户' },
        { value: 735, name: '商户' },
        { value: 580, name: '骑手' },
      ]
    }
  ]
})

const fetchDashboardData = async () => {
  try {
    const data: any = await api.get('/admin/dashboard')
    if (data) {
      stats.value = data.stats
      lineChartOption.value.xAxis.data = data.lineChart.xAxis
      lineChartOption.value.series[0].data = data.lineChart.series
      lineChartOption.value = { ...lineChartOption.value } // 触发 ECharts 更新
      
      pieChartOption.value.series[0].data = data.pieChart
      pieChartOption.value = { ...pieChartOption.value } // 触发 ECharts 更新
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}
.stat-cards {
  margin-bottom: 20px;
}
.stat-card {
  color: #fff;
}
.bg-blue { background: linear-gradient(135deg, #409EFF, #79bbff); }
.bg-green { background: linear-gradient(135deg, #67C23A, #95d475); }
.bg-orange { background: linear-gradient(135deg, #E6A23C, #eebe77); }
.bg-purple { background: linear-gradient(135deg, #9c27b0, #b3e19d); }

.title {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}
.value {
  font-size: 28px;
  font-weight: bold;
}
.chart-container {
  height: 350px;
}
.chart {
  width: 100%;
  height: 100%;
}
</style>
