<template>
  <div id="app">
    <!-- 如果是登录页，直接渲染路由视图 -->
    <router-view v-if="$route.path === '/login'" />
    
    <!-- 否则渲染带侧边栏和头部的后台布局 -->
    <el-container class="layout-container" v-else>
      <el-aside width="200px">
        <div class="logo">外卖管理后台</div>
        <el-menu router :default-active="$route.path" background-color="#304156" text-color="#fff" active-text-color="#409eff">
          <el-menu-item index="/dashboard">数据看板</el-menu-item>
          <el-menu-item index="/review">审核中心</el-menu-item>
          <el-menu-item index="/users">用户管理</el-menu-item>
          <el-menu-item index="/orders">订单管理</el-menu-item>
          <el-menu-item index="/settings">平台设置</el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="app-header">
          <h2>大学城外卖平台</h2>
          <div class="header-right">
            <span class="welcome-text">欢迎, {{ adminName }}</span>
            <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
          </div>
        </el-header>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  computed: {
    adminName() {
      try {
        const userStr = localStorage.getItem('adminUser');
        const user = userStr ? JSON.parse(userStr) : null;
        return user ? user.username : 'Admin';
      } catch (e) {
        return 'Admin';
      }
    }
  },
  methods: {
    handleLogout() {
      (this as any).$confirm('确定要退出登录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        this.$router.push('/login');
      }).catch(() => {});
    }
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.el-aside {
  background-color: #304156;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}
.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-right {
  display: flex;
  align-items: center;
}
.welcome-text {
  margin-right: 20px;
  font-size: 14px;
  color: #606266;
}
</style>
