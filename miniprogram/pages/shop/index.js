import { request } from '../../utils/request';

Page({
  data: {
    shopId: '',
    shopInfo: {},
    products: [],
    categories: [],
    activeCategory: '全部商品',
    displayedProducts: [],
    totalPrice: 0,
    totalQuantity: 0,
    cart: [],
    showCartDetail: false,
    activeTab: 0,
    searchKeyword: '',
    reviews: []
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ shopId: id });
      // 因为 setState 是异步的，为了保证能拿到最新的 shopId
      // 使用 nextTick 或者直接传参比较稳妥，这里直接用传入的 id
      this.fetchShopInfo(id);
      this.fetchProducts(id);
    }
  },

  onShow() {
    // 每次显示页面时重新同步全局购物车状态，防止在其他页面清空后状态不同步
    if (this.data.shopId && this.data.products.length > 0) {
      const globalCarts = wx.getStorageSync('globalCarts') || {};
      const shopCart = globalCarts[this.data.shopId] || { items: [] };
      const cartMap = {};
      if (shopCart.items) {
        shopCart.items.forEach(item => {
          cartMap[item.id] = item.quantity;
        });
      }

      const products = this.data.products.map(p => ({ ...p, quantity: cartMap[p.id] || 0 }));
      
      this.setData({ products }, () => {
        this.updateDisplayedProducts();
        this.calculateCart();
      });
    }
  },

  fetchShopInfo(id) {
    wx.showLoading({ title: '加载中' });
    request({
      url: `/merchants/detail/${id}`
    }).then(res => {
      this.setData({
        shopInfo: res
      });
    }).catch(() => {
      wx.showToast({ title: '获取商家信息失败', icon: 'none' });
    }).finally(() => {
      // 避免两个并发请求造成 loading 配对问题，实际项目中可提取共用 loading 计数器
      wx.hideLoading();
    });
  },

  fetchProducts(id) {
    request({
      url: `/products/shop/${id}`
    }).then((res) => {
      // 初始化 quantity，从全局购物车读取
      const globalCarts = wx.getStorageSync('globalCarts') || {};
      const shopCart = globalCarts[id] || { items: [] };
      const cartMap = {};
      if (shopCart.items) {
        shopCart.items.forEach(item => {
          cartMap[item.id] = item.quantity;
        });
      }

      const products = res.map(p => ({ ...p, quantity: cartMap[p.id] || 0 }));
      
      // 提取分类
      const categoriesSet = new Set();
      products.forEach(p => {
        const cat = p.category || '默认分类';
        p.category = cat; // 补充默认值
        categoriesSet.add(cat);
      });
      const categories = Array.from(categoriesSet);

      this.setData({ 
        products,
        categories,
        displayedProducts: products
      }, () => {
        // 计算初始购物车状态
        this.calculateCart();
      });
    }).catch(() => {
      wx.showToast({ title: '获取商品失败', icon: 'none' });
    });
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    let displayedProducts = [];
    if (category === '全部商品') {
      displayedProducts = this.data.products;
    } else {
      displayedProducts = this.data.products.filter(p => p.category === category);
    }
    this.setData({
      activeCategory: category,
      displayedProducts
    });
  },

  increaseCart(e) {
    const id = e.currentTarget.dataset.id;
    const index = this.data.products.findIndex(p => p.id == id);
    if (index === -1) return;
    
    const product = this.data.products[index];
    if (product.quantity >= product.stock) {
      return wx.showToast({ title: '库存不足', icon: 'none' });
    }
    
    const key = `products[${index}].quantity`;
    this.setData({ [key]: product.quantity + 1 }, () => {
      this.updateDisplayedProducts();
      this.calculateCart();
    });
  },

  decreaseCart(e) {
    const id = e.currentTarget.dataset.id;
    const index = this.data.products.findIndex(p => p.id == id);
    if (index === -1) return;
    
    const product = this.data.products[index];
    if (product.quantity <= 0) return;

    const key = `products[${index}].quantity`;
    this.setData({ [key]: product.quantity - 1 }, () => {
      this.updateDisplayedProducts();
      this.calculateCart();
    });
  },

  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({ activeTab: index });
    if (index === 1 && this.data.reviews.length === 0) {
      this.fetchReviews();
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value }, () => {
      this.updateDisplayedProducts();
    });
  },

  fetchReviews() {
    request({
      url: `/reviews/merchant/${this.data.shopId}`
    }).then(res => {
      this.setData({ reviews: res });
    }).catch(() => {
      wx.showToast({ title: '获取评价失败', icon: 'none' });
    });
  },

  openLocation() {
    const { lat, lng, shopName, address } = this.data.shopInfo;
    if (lat && lng) {
      wx.openLocation({
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        name: shopName,
        address: address
      });
    } else {
      wx.showToast({ title: '暂无位置信息', icon: 'none' });
    }
  },

  callMerchant() {
    const phone = this.data.shopInfo.phone;
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone });
    } else {
      wx.showToast({ title: '商家暂无电话', icon: 'none' });
    }
  },

  previewLicense() {
    const img = this.data.shopInfo.licenseImg;
    if (img) {
      wx.previewImage({ urls: [img] });
    }
  },

  updateDisplayedProducts() {
    let displayedProducts = [];
    if (this.data.activeCategory === '全部商品') {
      displayedProducts = this.data.products;
    } else {
      displayedProducts = this.data.products.filter(p => p.category === this.data.activeCategory);
    }
    
    if (this.data.searchKeyword) {
      displayedProducts = displayedProducts.filter(p => p.name.includes(this.data.searchKeyword));
    }
    
    this.setData({ displayedProducts });
  },

  calculateCart() {
    let price = 0;
    let qty = 0;
    const cart = [];

    this.data.products.forEach(p => {
      if (p.quantity > 0) {
        price += p.price * p.quantity;
        qty += p.quantity;
        cart.push(p);
      }
    });

    let showCartDetail = this.data.showCartDetail;
    if (qty === 0) {
      showCartDetail = false; // 如果购物车空了，自动关闭弹窗
    }

    this.setData({
      totalPrice: price.toFixed(2),
      totalQuantity: qty,
      cart,
      showCartDetail
    });

    // 保存到全局购物车
    const globalCarts = wx.getStorageSync('globalCarts') || {};
    if (qty > 0) {
      globalCarts[this.data.shopId] = {
        shopId: this.data.shopId,
        shopName: this.data.shopInfo.shopName,
        shopLogo: this.data.shopInfo.logo,
        minOrder: this.data.shopInfo.minOrder,
        items: cart,
        totalPrice: price.toFixed(2),
        totalQuantity: qty
      };
    } else {
      delete globalCarts[this.data.shopId];
    }
    wx.setStorageSync('globalCarts', globalCarts);
  },

  toggleCartDetail() {
    if (this.data.totalQuantity > 0) {
      this.setData({ showCartDetail: !this.data.showCartDetail });
    }
  },

  clearShopCart() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          const products = this.data.products.map(p => ({ ...p, quantity: 0 }));
          this.setData({ products, showCartDetail: false }, () => {
            this.updateDisplayedProducts();
            this.calculateCart();
          });
        }
      }
    });
  },

  addToGlobalCart() {
    if (this.data.totalQuantity === 0) {
      return wx.showToast({ title: '请先选择商品', icon: 'none' });
    }
    
    // 因为每次点击加号都已经实时更新了 globalCarts，
    // 所以这里其实只需要给用户一个反馈并返回即可
    wx.showToast({ title: '已加入购物车', icon: 'success' });
    
    setTimeout(() => {
      wx.navigateBack();
    }, 1000);
  },

  goToConfirm() {
    if (this.data.totalQuantity <= 0) {
      wx.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }

    if (Number(this.data.totalPrice) < Number(this.data.shopInfo.minOrder || 0)) {
      wx.showToast({ title: '未达到起送金额', icon: 'none' });
      return;
    }
    
    // 将购物车数据存入全局或 storage，以便确认订单页读取
    wx.setStorageSync('currentCart', {
      shopId: this.data.shopId,
      shopName: this.data.shopInfo.shopName,
      items: this.data.cart,
      totalPrice: this.data.totalPrice
    });

    // 清除可能存在的多选购物车缓存，确保订单确认页读取单店铺逻辑
    wx.removeStorageSync('selectedCarts');

    wx.navigateTo({
      url: '/pages/order/confirm/index'
    });
  }
});
