import { request } from '../../utils/request';

Page({
  data: {
    avatarUrl: ''
  },

  onChooseAvatar(e) {
    this.setData({
      avatarUrl: e.detail.avatarUrl
    });
  },

  handleLogin(e) {
    const nickname = e.detail.value.nickname;
    const avatarUrl = this.data.avatarUrl;

    if (!avatarUrl) {
      return wx.showToast({ title: '请点击选择头像', icon: 'none' });
    }
    if (!nickname) {
      return wx.showToast({ title: '请输入或授权昵称', icon: 'none' });
    }

    wx.showLoading({ title: '登录中...' });

    wx.login({
      success: (res) => {
        if (res.code) {
          // 这里可以考虑将头像上传到自己的服务器，目前直接传 url 过去（注意这是临时链接，真实项目中需要上传持久化）
          request({
            url: '/auth/wx-login',
            method: 'POST',
            data: { 
              code: res.code,
              userInfo: {
                avatarUrl: avatarUrl,
                nickName: nickname
              }
            }
          }).then((data) => {
            wx.setStorageSync('token', data.access_token);
            wx.setStorageSync('userInfo', data.user);
            getApp().globalData.token = data.access_token;
            getApp().globalData.userInfo = data.user;
            getApp().connectSocket();
            wx.switchTab({ url: '/pages/index/index' });
          }).catch((err) => {
            console.error('Login failed', err);
          }).finally(() => {
            wx.hideLoading();
          });
        } else {
          wx.hideLoading();
          console.log('登录失败！' + res.errMsg)
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '调用微信登录失败', icon: 'none' });
      }
    });
  }
})
