import { request } from '../../../utils/request';

Page({
  data: {
    cartData: {},
    carts: [], // 增加 carts 数组用于多店铺结算
    isMultiShop: false,
    address: {}, // 默认地址为空，引导用户选择
    contactName: '',
    contactPhone: '',
    deliveryFee: 5.0, // 每家店的基础配送费
    totalAmount: 0,
    remark: '',
    submitting: false
  },

  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  onLoad() {
    // 尝试从 storage 获取联系信息
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      contactName: userInfo.nickName || '',
      contactPhone: userInfo.phone || ''
    });

    // 从 storage 读取购物车数据
    const currentCart = wx.getStorageSync('currentCart');
    const selectedCarts = wx.getStorageSync('selectedCarts');

    if (selectedCarts && selectedCarts.length > 0) {
      // 多店铺结算模式
      let totalAmount = 0;
      const formattedCarts = selectedCarts.map(cart => {
        totalAmount += Number(cart.totalPrice) + this.data.deliveryFee;
        return {
          ...cart,
          items: cart.items.map(item => ({
            ...item,
            displayPrice: (item.price * item.quantity).toFixed(2)
          }))
        };
      });
      this.setData({
        isMultiShop: true,
        carts: formattedCarts,
        totalAmount: totalAmount.toFixed(2)
      });
    } else if (currentCart) {
      // 单店铺结算模式
      const amount = Number(currentCart.totalPrice) + this.data.deliveryFee;
      const formattedCart = {
        ...currentCart,
        items: currentCart.items.map(item => ({
          ...item,
          displayPrice: (item.price * item.quantity).toFixed(2)
        }))
      };
      this.setData({
        isMultiShop: false,
        cartData: formattedCart,
        carts: [formattedCart],
        totalAmount: amount.toFixed(2)
      });
    } else {
      wx.showToast({ title: '获取订单数据失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onShow() {
    const selectedAddress = wx.getStorageSync('selectedAddress');
    if (selectedAddress && selectedAddress.id) {
      wx.removeStorageSync('selectedAddress');
      this.applyAddress(selectedAddress);
      return;
    }

    if (!this.data.address.id) {
      this.loadDefaultAddress();
    }
  },

  loadDefaultAddress() {
    request({
      url: '/addresses/default',
      method: 'GET'
    }).then((res) => {
      if (res && res.id) {
        this.applyAddress(res);
      }
    }).catch(() => {});
  },

  applyAddress(address) {
    this.setData({
      address: {
        id: address.id,
        name: address.address,
        detail: address.detail,
        latitude: address.lat,
        longitude: address.lng,
        contactName: address.name,
        contactPhone: address.phone,
        isDefault: !!address.isDefault
      },
      contactName: address.name || '',
      contactPhone: address.phone || ''
    });
  },

  chooseAddress() {
    wx.navigateTo({
      url: '/pages/address/list/index?mode=select'
    });
  },

  onNameInput(e) {
    this.setData({ contactName: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ contactPhone: e.detail.value });
  },

  async submitOrder() {
    if (!this.data.address.detail) {
      return wx.showToast({ title: '请选择配送地址', icon: 'none' });
    }
    if (!this.data.contactName || !this.data.contactPhone) {
      return wx.showToast({ title: '请完善联系人信息', icon: 'none' });
    }

    this.setData({ submitting: true });

    try {
      const orderIds = [];
      // 如果有多个店铺，需要依次调用创建订单接口
      for (const cart of this.data.carts) {
        const orderData = {
          merchantId: Number(cart.shopId),
          items: cart.items.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          })),
          address: this.data.contactName + ' ' + this.data.contactPhone,
          addressDetail: this.data.address.name + ' (' + this.data.address.detail + ')',
          lat: this.data.address.latitude,
          lng: this.data.address.longitude,
          remark: this.data.remark
        };
        
        const orderRes = await request({
          url: '/orders',
          method: 'POST',
          data: orderData
        });
        orderIds.push(orderRes.id);
      }
      
      // 在多店铺场景下，实际微信支付如果只有一次支付行为，需要后端支持合并支付。
      // 因为目前后端 payment 接口只接收一个 orderId 进行支付。
      // 这里的妥协方案：我们拿第一个订单去模拟获取支付参数。
      // 反正是测试环境，支付成功后把这些 orderId 的支付状态全都手动模拟更新或者只处理第一单。
      // 为了让体验闭环：我们就用第一单拉起支付。
      this.requestPayment(orderIds);
    } catch (err) {
      this.setData({ submitting: false });
      wx.showToast({ title: err.data?.message || '下单失败', icon: 'none' });
    }
  },

  requestPayment(orderIds) {
    // 在测试环境下，直接模拟支付成功
    wx.showModal({
      title: '支付确认',
      content: `订单总金额：￥${this.data.totalAmount}，是否确认支付？`,
      success: (res) => {
        if (res.confirm) {
          // 调用后端模拟支付成功接口
          wx.showLoading({ title: '支付中...' });
          
          // 依次处理每个订单的支付状态更新
          const promises = orderIds.map(orderId => {
            return request({
              url: `/payment/mock-pay-success/${orderId}`,
              method: 'POST'
            });
          });
          
          Promise.all(promises)
            .then(() => {
              wx.hideLoading();
              this.handlePaySuccess(orderIds);
            })
            .catch(err => {
              wx.hideLoading();
              wx.showToast({ title: '支付处理失败', icon: 'none' });
              this.setData({ submitting: false });
            });
        } else {
          this.setData({ submitting: false });
        }
      }
    });
  },

  handlePaySuccess(orderIds) {
    wx.showToast({ title: '支付成功', icon: 'success' });
    
    // 清除当前购物车和对应的全局购物车
    const globalCarts = wx.getStorageSync('globalCarts') || {};
    this.data.carts.forEach(cart => {
      delete globalCarts[cart.shopId];
    });
    wx.setStorageSync('globalCarts', globalCarts);
    wx.removeStorageSync('currentCart');
    wx.removeStorageSync('selectedCarts'); // 清除多选结算缓存

    // 跳转到订单列表页
    setTimeout(() => {
      wx.switchTab({ url: '/pages/order/list/index' });
    }, 1500);
  }
});
