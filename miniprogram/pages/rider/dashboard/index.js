import { request } from '../../../utils/request';

Page({
  data: {
    isOnline: false,
    nearbyOrders: [], // 待抢订单
    activeOrders: [], // 正在配送的订单
    stats: {
      orderCount: 0,
      income: 0
    }
  },

  onShow() {
    this.fetchRiderProfile();
    this.fetchTodayStats();
  },

  fetchRiderProfile() {
    request({
      url: '/riders/my/profile'
    }).then(res => {
      this.setData({ isOnline: res.isOnline });
      if (res.isOnline) {
        this.fetchNearbyOrders();
        this.fetchActiveOrders();
      }
    }).catch(err => {
      console.error('Fetch Profile Error:', err);
    });
  },

  fetchTodayStats() {
    request({
      url: '/riders/my/stats'
    }).then(res => {
      this.setData({ stats: res });
    }).catch(err => {
      console.error('Fetch Stats Error:', err);
    });
  },

  fetchActiveOrders() {
    request({
      url: '/riders/my/active-orders'
    }).then(res => {
      const formatted = res.map(order => ({
        ...order,
        shopName: order.merchant?.shopName || '某商店',
        customerName: (order.user && order.user.nickname) || '用户',
        distanceDisplay: order.distanceToUser ? `${order.distanceToUser}km` : '计算中...'
      }));
      this.setData({ activeOrders: formatted });
    }).catch(err => {
      console.error('Fetch Active Orders Error:', err);
    });
  },

  goToRiderMap() {
    wx.navigateTo({
      url: '/pages/rider/map/index'
    });
  },

  toggleOnline(e) {
    const isOnline = e.detail.value;
    wx.showLoading({ title: '正在切换状态...' });
    request({
      url: '/riders/online',
      method: 'PUT',
      data: { isOnline }
    }).then(() => {
      this.setData({ isOnline });
      wx.hideLoading();
      if (isOnline) {
        this.fetchNearbyOrders();
        this.fetchActiveOrders();
      } else {
        this.setData({ nearbyOrders: [], activeOrders: [] });
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ isOnline: !isOnline });
      wx.showToast({ title: err.data?.message || '切换失败', icon: 'none' });
    });
  },

  fetchNearbyOrders() {
    wx.showLoading({ title: '加载中' });
    request({
      url: `/riders/nearby-orders?lat=39.90469&lng=116.40717`
    }).then((res) => {
      const formatted = res.map(order => ({
        ...order,
        shopName: order.merchant?.shopName || '某商店',
        distance: '1.2',
        fee: order.deliveryFee
      }));
      this.setData({ nearbyOrders: formatted });
    }).catch(() => {
      wx.showToast({ title: '获取附近订单失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  acceptOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '抢单确认',
      content: '确定要接下这一单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '抢单中...' });
          request({
            url: `/riders/orders/${id}/accept`,
            method: 'PUT'
          }).then(() => {
            wx.showToast({ title: '接单成功', icon: 'success' });
            this.fetchNearbyOrders();
            this.fetchActiveOrders();
          }).catch(err => {
            wx.showToast({ title: err.data?.message || '接单失败', icon: 'none' });
          }).finally(() => {
            wx.hideLoading();
          });
        }
      }
    });
  },

  openRiderNavigation(e) {
    const { lat, lng, name, shopLat, shopLng, shopName } = e.currentTarget.dataset;
    
    // 使用小程序内置地图导航
    wx.showModal({
      title: '选择导航目的地',
      content: '请选择您要导航到哪里？',
      confirmText: '先去商家',
      cancelText: '直接去用户',
      success: (modalRes) => {
        let url = '';
        if (modalRes.confirm && shopLat && shopLng) {
          // 先去商家
          url = `/pages/rider/map/index?shopLat=${shopLat}&shopLng=${shopLng}&userLat=${lat}&userLng=${lng}&target=shop`;
        } else if (lat && lng) {
          // 直接去用户
          url = `/pages/rider/map/index?shopLat=${shopLat}&shopLng=${shopLng}&userLat=${lat}&userLng=${lng}&target=user`;
        } else {
          wx.showToast({ title: '暂无位置信息', icon: 'none' });
          return;
        }
        wx.navigateTo({ url });
      }
    });
  },

  deliverOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '送达确认',
      content: '确定已将订单送达吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '提交中...' });
          request({
            url: `/riders/orders/${id}/deliver`,
            method: 'PUT'
          }).then(() => {
            wx.showToast({ title: '送达成功', icon: 'success' });
            this.fetchActiveOrders();
            this.fetchTodayStats();
          }).catch(err => {
            wx.showToast({ title: err.data?.message || '操作失败', icon: 'none' });
          }).finally(() => {
            wx.hideLoading();
          });
        }
      }
    });
  }
})
