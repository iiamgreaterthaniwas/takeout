import { request } from '../../../utils/request';

Page({
  data: {
    settings: {
      productRate: 5.0,
      deliveryRate: 10.0
    }
  },

  onShow() {
    this.fetchSettings();
  },

  fetchSettings() {
    wx.showLoading({ title: '加载中' });
    request({
      url: '/admin/settings'
    }).then(res => {
      if (res) {
        this.setData({ settings: res });
      }
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      wx.hideLoading();
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`settings.${field}`]: e.detail.value
    });
  },

  saveSettings() {
    wx.showLoading({ title: '保存中' });
    request({
      url: '/admin/settings',
      method: 'POST',
      data: this.data.settings
    }).then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' });
    }).catch(err => {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  }
});
