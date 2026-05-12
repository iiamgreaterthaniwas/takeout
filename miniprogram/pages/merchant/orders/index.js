import { request } from '../../../utils/request';

Page({
  data: {
    activeTab: 'paid', // paid, accepted, all
    orders: [],
    refreshing: false,
    stats: {
      pendingCount: 0
    },
    statusMap: {
      pending_payment: '待支付',
      paid: '待接单',
      accepted: '备餐中',
      ready: '待骑手取餐',
      delivering: '配送中',
      delivered: '已送达',
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退款'
    }
  },

  onShow() {
    this.fetchOrders();
  },

  onRefresh() {
    this.setData({ refreshing: true });
    this.fetchOrders().finally(() => {
      this.setData({ refreshing: false });
    });
  },

  switchTab(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ activeTab: status });
    this.fetchOrders();
  },

  fetchOrders() {
    const status = this.data.activeTab === 'all' ? '' : this.data.activeTab;
    return request({
      url: `/orders/shop${status ? '?status=' + status : ''}`
    }).then((res) => {
      // 简单格式化时间
      const formatted = res.map((item) => {
        const date = new Date(item.createdAt);
        return {
          ...item,
          createdAt: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
        };
      });
      
      // 计算待处理订单数
      const pendingCount = this.data.activeTab === 'paid' ? formatted.length : this.data.stats.pendingCount;
      
      this.setData({ 
        orders: formatted,
        'stats.pendingCount': pendingCount
      });
    });
  },

  callCustomer(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone });
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    // 假设有详情页
    // wx.navigateTo({ url: `/pages/order/detail/index?id=${id}` });
    wx.showToast({ title: '详情功能开发中', icon: 'none' });
  },

  handleAction(e) {
    const { id, action } = e.currentTarget.dataset;
    const url = `/orders/shop/${id}/${action}`; // action: accept or ready
    const title = action === 'accept' ? '接单成功' : '备餐完成';

    wx.showLoading({ title: '处理中...' });
    request({
      url,
      method: 'PUT'
    }).then(() => {
      wx.showToast({ title, icon: 'success' });
      this.fetchOrders();
    }).catch(err => {
      wx.showToast({ title: err.data?.message || '操作失败', icon: 'none' });
    });
  }
});
