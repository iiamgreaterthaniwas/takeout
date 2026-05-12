<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="login-title">大学城外卖后台管理系统</h2>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" @keyup.enter.native="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="管理员账号 (默认: admin)"
            prefix-icon="el-icon-user"
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="管理员密码 (默认: admin123)"
            prefix-icon="el-icon-lock"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" class="login-btn" :loading="loading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import api from '../api';

export default defineComponent({
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      rules: {
        username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
        password: [{ required: true, message: '请输入管理员密码', trigger: 'blur' }]
      },
      loading: false
    };
  },
  methods: {
    handleLogin() {
      (this.$refs.loginFormRef as any).validate((valid: boolean) => {
        if (valid) {
          this.loading = true;
          api.post('/auth/admin-login', this.loginForm)
            .then((res: any) => {
              // 这里的 res 已经是 response.data，由于后端的 authService 结构：
              // return { access_token, user }
              const { access_token, user } = res;
              localStorage.setItem('adminToken', access_token);
              localStorage.setItem('adminUser', JSON.stringify(user));
              (this as any).$message.success('登录成功');
              this.$router.push('/dashboard');
            })
            .catch(err => {
              // 错误已由拦截器处理
              console.error('Login error:', err);
            })
            .finally(() => {
              this.loading = false;
            });
        }
      });
    }
  }
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #2d3a4b;
  background-image: linear-gradient(135deg, #2d3a4b 0%, #1e283c 100%);
}

.login-card {
  width: 400px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
  font-size: 22px;
}

.login-btn {
  width: 100%;
  font-size: 16px;
  padding: 12px 0;
}
</style>