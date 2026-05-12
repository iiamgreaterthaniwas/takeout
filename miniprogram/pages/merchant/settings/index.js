import { request } from '../../../utils/request';
const { uploadFile } = require('../../../utils/upload');
console.log('uploadFile loaded:', typeof uploadFile);

Page({
  data: {
    logo: '',
    shopName: '',
    description: '',
    phone: '',
    address: '',
    lat: '',
    lng: '',
    minOrder: '',
    deliveryFee: '',
    licenseImg: '',
    category: '',
    categories: ['快餐便当', '特色小吃', '西式快餐', '中式炒菜', '甜品饮品', '火锅串串', '烧烤海鲜', '超市便利'],
    categoryIndex: -1
  },

  onLoad() {
    console.log('Merchant Settings onLoad');
    this.fetchShopInfo();
  },

  fetchShopInfo() {
    wx.showLoading({ title: '加载中' });
    request({
      url: '/merchants/my'
    }).then(res => {
      console.log('Shop Info Response:', res);
      if (res) {
        let categoryIndex = this.data.categories.indexOf(res.category);
        this.setData({
          logo: res.logo || '',
          shopName: res.shopName || '',
          description: res.description || '',
          phone: res.phone || '',
          address: res.address || '',
          lat: res.lat || '',
          lng: res.lng || '',
          minOrder: res.minOrder || 0,
          deliveryFee: res.deliveryFee || 0,
          licenseImg: res.licenseImg || '',
          category: res.category || '',
          categoryIndex: categoryIndex
        });
      }
    }).catch(err => {
      console.error('Fetch Shop Info Error:', err);
      wx.showToast({ title: '获取店铺信息失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  onCategoryChange(e) {
    const index = e.detail.value;
    this.setData({
      categoryIndex: index,
      category: this.data.categories[index]
    });
  },

  chooseLocation() {
    console.log('Choosing location...');
    wx.chooseLocation({
      success: (res) => {
        console.log('Location chosen:', res);
        this.setData({
          address: res.address + (res.name ? '·' + res.name : ''),
          lat: res.latitude,
          lng: res.longitude
        });
      },
      fail: (err) => {
        console.error('Choose location failed:', err);
        if (err.errMsg.indexOf('auth deny') !== -1) {
          wx.showModal({
            title: '授权提示',
            content: '需要位置权限才能选择地址，请去设置页开启',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        }
      }
    });
  },

  chooseLogoImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中' });
        
        uploadFile(tempFilePath).then(url => {
          this.setData({ logo: url });
          wx.hideLoading();
        }).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      }
    });
  },

  chooseLicenseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中' });
        
        uploadFile(tempFilePath).then(url => {
          this.setData({ licenseImg: url });
          wx.hideLoading();
        }).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      }
    });
  },

  saveSettings() {
    const { logo, shopName, description, phone, address, lat, lng, minOrder, deliveryFee, licenseImg, category } = this.data;
    
    if (!shopName || !address || !phone) {
      return wx.showToast({ title: '请填写完整基本信息', icon: 'none' });
    }

    const updateData = {
      logo,
      shopName,
      description,
      phone,
      address,
      minOrder: parseFloat(minOrder) || 0,
      deliveryFee: parseFloat(deliveryFee) || 0,
      licenseImg,
      category
    };

    // 只有当 lat 和 lng 有有效值时才发送，避免发送 null 导致后端 Prisma 报错
    if (lat !== '' && lat !== null && lat !== undefined) {
      updateData.lat = parseFloat(lat);
    }
    if (lng !== '' && lng !== null && lng !== undefined) {
      updateData.lng = parseFloat(lng);
    }

    wx.showLoading({ title: '保存中' });
    request({
      url: '/merchants/my',
      method: 'PUT',
      data: updateData
    }).then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: err.data?.message || '保存失败', icon: 'none' });
    });
  }
});