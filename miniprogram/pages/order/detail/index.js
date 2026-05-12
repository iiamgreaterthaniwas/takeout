import { request } from '../../../utils/request';

Page({
  data: {
    order: null,
    statusTextMap: {
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
    }
  },

  onLoad(options) {
    if (options.id) {
      this.fetchOrderDetail(options.id);
    }
  },

  fetchOrderDetail(id) {
    wx.showLoading({ title: '加载中' });
    request({
      url: `/orders/${id}`,
      method: 'GET'
    }).then(res => {
      if (res) {
        // 格式化预估时间
        let formattedEta = null;
        if (res.estimatedArrival) {
          const eta = new Date(res.estimatedArrival);
          const hours = eta.getHours().toString().padStart(2, '0');
          const minutes = eta.getMinutes().toString().padStart(2, '0');
          formattedEta = `${hours}:${minutes}`;
        }

        this.setData({
          order: {
            ...res,
            statusText: this.data.statusTextMap[res.status] || res.status,
            formattedAmount: Number(res.totalAmount).toFixed(2),
            formattedDeliveryFee: Number(res.deliveryFee).toFixed(2),
            formattedEta: formattedEta,
            items: (res.items || []).map(item => ({
              ...item,
              displayProductName: item.productName || item.product?.name || '未知商品',
              displayImageUrl: item.product?.imageUrl || item.imageUrl || '/images/default-product.png',
              formattedPrice: Number(item.unitPrice).toFixed(2)
            }))
          }
        });
      }
    }).catch(err => {
      console.error('获取订单详情失败', err);
      wx.showToast({ title: '获取详情失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  callMerchant() {
    if (this.data.order && this.data.order.merchant && this.data.order.merchant.contactPhone) {
      wx.makePhoneCall({
        phoneNumber: this.data.order.merchant.contactPhone
      });
    }
  },

  openNavigation() {
    if (!this.data.order) return;
    
    // 跳转到骑手地图路线规划页（小程序内）
    const order = this.data.order;
    let queryParams = {};
    
    if (order.lat && order.lng) {
      queryParams.userLat = order.lat;
      queryParams.userLng = order.lng;
      queryParams.target = 'user';
    }
    
    if (order.merchant?.lat && order.merchant?.lng) {
      queryParams.shopLat = order.merchant.lat;
      queryParams.shopLng = order.merchant.lng;
    }

    if (order.rider?.currentLat && order.rider?.currentLng) {
      queryParams.riderLat = order.rider.currentLat;
      queryParams.riderLng = order.rider.currentLng;
    }
    
    const query = Object.keys(queryParams)
      .filter(key => queryParams[key] !== undefined && queryParams[key] !== null)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    wx.navigateTo({
      url: `/pages/rider/map/index?${query}`
    });
  },

  goToTrack() {
    if (this.data.order && this.data.order.id) {
      wx.navigateTo({
        url: `/pages/track/index?orderId=${this.data.order.id}`
      });
    }
  },

  goToReview() {
    wx.navigateTo({
      url: `/pages/order/review/index?id=${this.data.order.id}`
    });
  },

  payOrder() {
    if (!this.data.order) return;
    const orderId = this.data.order.id;
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
            this.fetchOrderDetail(orderId);
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: '支付失败', icon: 'none' });
          });
        }
      }
    });
  },

  cancelOrder() {
    if (!this.data.order) return;
    const orderId = this.data.order.id;
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
            this.fetchOrderDetail(orderId);
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: err.data?.message || '取消失败', icon: 'none' });
          });
        }
      }
    });
  },

  deleteOrder() {
    if (!this.data.order) return;
    const orderId = this.data.order.id;
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
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: err.data?.message || '删除失败', icon: 'none' });
          });
        }
      }
    });
  }
})