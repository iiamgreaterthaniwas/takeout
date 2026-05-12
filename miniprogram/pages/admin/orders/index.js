import { request } from '../../../utils/request';

Page({
  data: {
    orders: []
  },

  onShow() {
    this.fetchOrders();
  },

  fetchOrders() {
    wx.showLoading({ title: '加载中' });
    request({
      url: '/admin/orders'
    }).then(res => {
      this.setData({ orders: res });
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      wx.hideLoading();
    });
  }
});
