import { request } from '../../../utils/request';

Page({
  data: {
    orders: []
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabbar = this.getTabBar();
      const index = tabbar.data.tabs.findIndex(item => item.path === 'pages/order/list/index');
      if (index !== -1) tabbar.setData({ selected: index });
    }
    this.fetchOrders();
  },

  fetchOrders() {
    wx.showLoading({ title: '加载中' });
    request({
      url: '/orders/my'
    }).then(res => {
      const orders = res.map(order => {
        let goodsDesc = '暂无商品';
        let displayImage = '/images/default-product.png';
        
        if (order.items && order.items.length > 0) {
          const firstItem = order.items[0];
          // 优先使用 productName，备选 product.name
          const firstItemName = firstItem.productName || firstItem.product?.name || '未知商品';
          goodsDesc = `${firstItemName}${order.items.length > 1 ? '等' + order.items.length + '件商品' : ''}`;
          
          // 优先使用第一个商品的图片
          displayImage = firstItem.product?.imageUrl || firstItem.imageUrl || '/images/default-product.png';
        } else if (order.merchant && order.merchant.logo) {
          displayImage = order.merchant.logo;
        }

        return {
          ...order,
          shopName: order.merchant?.shopName || '未知店铺',
          totalPrice: Number(order.totalAmount).toFixed(2),
          goodsDesc,
          displayImage,
          statusText: this.getStatusText(order.status)
        };
      });
      this.setData({ orders });
    }).catch(() => {
      wx.showToast({ title: '获取订单失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  getStatusText(status) {
    const statusMap = {
      'pending_payment': '待付款',
      'paid': '已支付',
      'accepted': '商家已接单',
      'preparing': '备餐中',
      'ready': '待取餐',
      'delivering': '配送中',
      'delivered': '已送达',
      'completed': '已完成',
      'cancelled': '已取消',
      'refund_pending': '退款中',
      'refunded': '已退款'
    };
    return statusMap[status] || status;
  },

  goToDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/detail/index?id=${orderId}`
    });
  },

  goToTrack(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/track/index?orderId=${orderId}`
    });
  },

  goToReview(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/review/index?id=${orderId}`
    });
  },

  payOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '支付确认',
      content: '是否确认支付此订单？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '支付中...' });
          request({
            url: `/payment/mock-pay-success/${orderId}`,
            method: 'POST'
          }).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '支付成功', icon: 'success' });
            this.fetchOrders();
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: '支付失败', icon: 'none' });
          });
        }
      }
    });
  },

  cancelOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消订单',
      content: '确定要取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在取消...' });
          request({
            url: `/orders/${orderId}/cancel`,
            method: 'PUT'
          }).then(() => {
            wx.showToast({ title: '订单已取消', icon: 'success' });
            this.fetchOrders();
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: err.data?.message || '取消失败', icon: 'none' });
          });
        }
      }
    });
  },

  deleteOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除订单',
      content: '确定要删除该订单记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在删除...' });
          request({
            url: `/orders/${orderId}`,
            method: 'DELETE'
          }).then(() => {
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.fetchOrders();
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: err.data?.message || '删除失败', icon: 'none' });
          });
        }
      }
    });
  }
})
