import { request } from '../../../utils/request';

Page({
  data: {
    list: [],
    mode: 'manage'
  },

  onLoad(options) {
    this.setData({
      mode: options.mode === 'select' ? 'select' : 'manage'
    });
  },

  onShow() {
    this.fetchAddresses();
  },

  fetchAddresses() {
    wx.showLoading({ title: '加载中' });
    request({
      url: '/addresses',
      method: 'GET'
    }).then((res) => {
      this.setData({ list: res || [] });
    }).catch(() => {
      wx.showToast({ title: '获取地址失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/address/edit/index' });
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/address/edit/index?id=${id}` });
  },

  selectAddress(e) {
    if (this.data.mode !== 'select') return;
    const id = Number(e.currentTarget.dataset.id);
    const item = this.data.list.find((addr) => addr.id === id);
    if (!item) return;
    wx.setStorageSync('selectedAddress', item);
    wx.navigateBack();
  },

  setDefault(e) {
    const id = e.currentTarget.dataset.id;
    request({
      url: `/addresses/${id}/default`,
      method: 'PUT'
    }).then(() => {
      wx.showToast({ title: '已设为默认', icon: 'success' });
      this.fetchAddresses();
    });
  },

  deleteAddress(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除地址',
      content: '确定删除这个收货地址吗？',
      success: (res) => {
        if (!res.confirm) return;
        request({
          url: `/addresses/${id}`,
          method: 'DELETE'
        }).then(() => {
          wx.showToast({ title: '删除成功', icon: 'success' });
          this.fetchAddresses();
        });
      }
    });
  },

  noop() {}
  
});
