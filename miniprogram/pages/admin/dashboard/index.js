import { request } from '../../../utils/request';

Page({
  data: {
    stats: {
      todayOrders: 0,
      todayGMV: 0,
      newMerchants: 0,
      newRiders: 0
    },
    pieChart: []
  },

  onShow() {
    this.fetchDashboardData();
  },

  fetchDashboardData() {
    wx.showLoading({ title: '加载中' });
    request({
      url: '/admin/dashboard'
    }).then(res => {
      this.setData({
        stats: res.stats,
        pieChart: res.pieChart
      });
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      wx.hideLoading();
    });
  },

  goTo(e) {
    const page = e.currentTarget.dataset.page;
    wx.navigateTo({
      url: `/pages/admin/${page}/index`
    });
  }
}); 
