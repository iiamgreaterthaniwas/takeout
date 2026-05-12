import { request } from '../../utils/request';

console.log('profile/index.js is loading...');

Page({
  data: {
    userInfo: {
      nickname: '',
      avatar: '',
      role: 'user',
      roleText: '普通用户'
    }
  },

  onShow() {
    console.log('Profile onShow');
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabbar = this.getTabBar();
      const index = tabbar.data.tabs.findIndex(item => item.path === 'pages/profile/index');
      if (index !== -1) tabbar.setData({ selected: index });
    }
    
    const cachedUserInfo = wx.getStorageSync('userInfo');
    if (cachedUserInfo) {
      if (!cachedUserInfo.roleText) {
        cachedUserInfo.roleText = this.formatRole(cachedUserInfo.role);
      }
      this.setData({ userInfo: cachedUserInfo });
      this.refreshProfile();
    } else {
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },

  formatRole(role) {
    const roleMap = {
      'user': '普通用户',
      'merchant': '商户',
      'rider': '骑手',
      'both': '商户 & 骑手',
      'admin': '管理员'
    };
    return roleMap[role] || '普通用户';
  },

  refreshProfile() {
    request({
      url: '/auth/profile',
      method: 'GET'
    }).then(userInfo => {
      if (userInfo) {
        userInfo.roleText = this.formatRole(userInfo.role);
        this.setData({ userInfo });
        wx.setStorageSync('userInfo', userInfo);
        getApp().globalData.userInfo = userInfo;
      }
    }).catch(err => {
      console.error('刷新用户信息失败', err);
    });
  },

  goToApplyMerchant() {
    wx.navigateTo({ url: '/pages/apply-merchant/index' });
  },

  goToApplyRider() {
    wx.navigateTo({ url: '/pages/apply-rider/index' });
  },

  goToAddressList() {
    wx.navigateTo({ url: '/pages/address/list/index?mode=manage' });
  },

  goToRiderDash() {
    wx.navigateTo({ url: '/pages/rider/dashboard/index' });
  },

  goToMerchantDash() {
    wx.navigateTo({ url: '/pages/merchant/dashboard/index' });
  },

  goToAdminDash() {
    wx.navigateTo({ url: '/pages/admin/dashboard/index' });
  },

  logout() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    getApp().globalData.token = null;
    getApp().globalData.userInfo = null;
    wx.reLaunch({ url: '/pages/login/login' });
  }
})
