import { request } from '../../utils/request';
import { config } from '../../config.js';

Page({
  data: {
    shops: [],
    currentLat: 39.90469,
    currentLng: 116.40717,
    currentAddress: '正在定位...',
    keyword: '',
    category: '',
    totalCartQuantity: 0
  },
  
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabbar = this.getTabBar();
      const index = tabbar.data.tabs.findIndex(item => item.path === 'pages/index/index');
      if (index !== -1) tabbar.setData({ selected: index });
    }
    this.updateGlobalCartQuantity();
  },

  updateGlobalCartQuantity() {
    const globalCarts = wx.getStorageSync('globalCarts') || {};
    let totalQty = 0;
    for (const shopId in globalCarts) {
      if (globalCarts[shopId].totalQuantity) {
        totalQty += globalCarts[shopId].totalQuantity;
      }
    }
    this.setData({ totalCartQuantity: totalQty });
  },

  goToGlobalCart() {
    wx.navigateTo({
      url: '/pages/cart/index'
    });
  },

  onLoad() {
    this.getLocationAndShops();
  },

  getLocationAndShops() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const { latitude, longitude } = res;
        this.setData({ currentLat: latitude, currentLng: longitude });
        this.fetchAddressName(latitude, longitude);
        this.fetchShops();
      },
      fail: () => {
        // 在开发者工具中，如果没有给位置权限，会走 fail
        wx.showToast({ title: '使用默认位置获取商家', icon: 'none' });
        this.setData({ currentAddress: '默认位置' });
        this.fetchShops();
      }
    });
  },

  fetchAddressName(lat, lng) {
    console.log('读取到的地图配置Key:', config.tencentMapKey);
    
    if (!config.tencentMapKey) {
      // 模拟逆地址解析
      setTimeout(() => {
        this.setData({ currentAddress: '未配置地图Key(默认地址)' });
      }, 500);
      return;
    }
    
    // 调用腾讯地图API进行逆地址解析获取详细地址
    wx.request({
      url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${config.tencentMapKey}&get_poi=0`,
      success: (res) => {
        if (res.data.status === 0 && res.data.result) {
          const address = res.data.result.formatted_addresses?.recommend || res.data.result.address;
          this.setData({ currentAddress: address });
        } else {
          this.setData({ currentAddress: '定位失败' });
          console.error('逆地址解析失败:', res.data);
        }
      },
      fail: (err) => {
        this.setData({ currentAddress: '网络异常' });
        console.error('请求腾讯地图接口失败:', err);
      }
    });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        if (res.name || res.address) {
          this.setData({
            currentLat: res.latitude,
            currentLng: res.longitude,
            currentAddress: res.name || res.address
          });
          this.fetchShops();
        }
      },
      fail: (err) => {
        console.log('选择位置失败', err);
      }
    });
  },

  fetchShops() {
    const { currentLat, currentLng, keyword, category } = this.data;
    let url = `/merchants/nearby?lat=${currentLat}&lng=${currentLng}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;

    request({ url }).then(res => {
      // res 返回的商家数据，需要增加一点距离的 mock（因为后端目前还没写球面距离计算）
      const shops = res.map((shop, index) => ({
        ...shop,
        distance: (0.5 + index * 0.7).toFixed(1) // 模拟一个距离
      }));
      this.setData({ shops });
    }).catch(() => {
      wx.showToast({ title: '获取商家列表失败', icon: 'none' });
    });
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value });
    this.fetchShops();
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ category });
    this.fetchShops();
  },

  goToShop(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/shop/index?id=${id}`
    });
  }
})
