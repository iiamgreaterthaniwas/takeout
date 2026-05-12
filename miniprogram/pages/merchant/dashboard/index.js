import { request } from '../../../utils/request';

Page({
  data: {
    isOpen: false,
    shopInfo: null,
    stats: {
      orderCount: 0,
      income: 0
    }
  },

  onShow() {
    this.fetchMyShop();
    this.fetchTodayStats();
  },

  fetchMyShop() {
    request({
      url: '/merchants/my'
    }).then(res => {
      this.setData({
        shopInfo: res,
        isOpen: res.isOpen
      });
    }).catch(err => {
      console.error(err);
    });
  },

  fetchTodayStats() {
    request({
      url: '/merchants/my/stats'
    }).then(res => {
      this.setData({
        stats: res
      });
    }).catch(err => {
      console.error('Fetch Stats Error:', err);
    });
  },

  toggleOpen(e) {
    const isOpen = e.detail.value;
    wx.showLoading({ title: '正在切换...' });
    request({
      url: '/merchants/my/open',
      method: 'PUT',
      data: { isOpen }
    }).then(() => {
      this.setData({ isOpen });
      wx.showToast({ title: '已切换状态', icon: 'success' });
    }).catch(err => {
      this.setData({ isOpen: !isOpen });
      wx.showToast({ title: err.data?.message || '切换失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  goToProducts() {
    wx.navigateTo({ url: '/pages/merchant/products/index' });
  },

  goToOrders() {
    wx.navigateTo({ url: '/pages/merchant/orders/index' });
  },

  goToShopSettings() {
    wx.navigateTo({ url: '/pages/merchant/settings/index' });
  }
}) 
