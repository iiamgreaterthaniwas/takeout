Page({
  data: {
    carts: [],
    totalAmount: 0,
    totalQuantity: 0,
    canCheckout: false
  },

  onShow() {
    this.loadCarts();
  },

  loadCarts() {
    const globalCarts = wx.getStorageSync('globalCarts') || {};
    const cartsArray = Object.values(globalCarts).filter(cart => cart.totalQuantity > 0);

    this.setData({ carts: cartsArray }, () => {
      this.calculateTotal();
    });
  },

  calculateTotal() {
    const { carts } = this.data;
    let totalAmount = 0;
    let totalQuantity = 0;
    let canCheckout = false;

    carts.forEach(cart => {
      totalAmount += Number(cart.totalPrice);
      totalQuantity += cart.totalQuantity;
    });

    // 判断所有在购物车中的店铺是否都达到了各自的起送价
    let meetMinOrder = true;
    carts.forEach(cart => {
      if (Number(cart.totalPrice) < Number(cart.minOrder || 0)) {
        meetMinOrder = false;
      }
    });
    
    canCheckout = carts.length > 0 && totalQuantity > 0 && meetMinOrder;

    this.setData({
      totalAmount: totalAmount.toFixed(2),
      totalQuantity: totalQuantity,
      canCheckout
    });
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  goToShop(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/shop/index?id=${id}` });
  },

  clearShopCart(e) {
    const shopId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认清空',
      content: '确定要清空该店铺的购物车吗？',
      success: (res) => {
        if (res.confirm) {
          const globalCarts = wx.getStorageSync('globalCarts') || {};
          delete globalCarts[shopId];
          wx.setStorageSync('globalCarts', globalCarts);
          this.loadCarts();
        }
      }
    });
  },

  increaseCart(e) {
    const { shopid, productid } = e.currentTarget.dataset;
    this.updateProductQuantity(shopid, productid, 1);
  },

  decreaseCart(e) {
    const { shopid, productid } = e.currentTarget.dataset;
    this.updateProductQuantity(shopid, productid, -1);
  },

  updateProductQuantity(shopId, productId, delta) {
    const globalCarts = wx.getStorageSync('globalCarts') || {};
    const cart = globalCarts[shopId];
    if (!cart) return;

    const productIndex = cart.items.findIndex(p => p.id == productId);
    if (productIndex === -1) return;

    const product = cart.items[productIndex];
    if (delta > 0 && product.quantity >= product.stock) {
      return wx.showToast({ title: '库存不足', icon: 'none' });
    }

    product.quantity += delta;
    
    // Recalculate shop cart
    let totalPrice = 0;
    let totalQty = 0;
    const newItems = [];
    
    cart.items.forEach(p => {
      if (p.quantity > 0) {
        totalPrice += p.price * p.quantity;
        totalQty += p.quantity;
        newItems.push(p);
      }
    });

    if (totalQty > 0) {
      cart.items = newItems;
      cart.totalPrice = totalPrice.toFixed(2);
      cart.totalQuantity = totalQty;
      globalCarts[shopId] = cart;
    } else {
      delete globalCarts[shopId];
    }

    wx.setStorageSync('globalCarts', globalCarts);
    this.loadCarts();
  },

  checkoutAll() {
    if (!this.data.canCheckout) {
      return wx.showToast({ title: '未满足起送条件或未选商品', icon: 'none' });
    }

    const { carts } = this.data;

    // 存入 selectedCarts 供订单确认页读取
    wx.setStorageSync('selectedCarts', carts);
    
    // 为了防止旧逻辑冲突，清除单店铺的 currentCart
    wx.removeStorageSync('currentCart');

    wx.navigateTo({
      url: '/pages/order/confirm/index'
    });
  }
});
