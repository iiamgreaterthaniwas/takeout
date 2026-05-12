import { request } from '../../utils/request';

Page({
  data: {
    formData: {
      shopName: '',
      contactPhone: '',
      address: '',
      licenseImg: ''
    },
    submitting: false
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadImage(tempFilePath);
      }
    });
  },

  uploadImage(filePath) {
    wx.showLoading({ title: '上传中...' });
    const token = wx.getStorageSync('token');
    wx.uploadFile({
      url: getApp().globalData.baseUrl + '/upload?type=licenses',
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        wx.hideLoading();
        const data = JSON.parse(res.data);
        if (data.url) {
          this.setData({ 'formData.licenseImg': data.url });
        } else {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '上传失败，请重试', icon: 'none' });
      }
    });
  },

  submitApply() {
    const { shopName, contactPhone, address, licenseImg } = this.data.formData;
    if (!shopName || !contactPhone || !address || !licenseImg) {
      return wx.showToast({ title: '请完整填写所有信息并上传执照', icon: 'none' });
    }
    if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
      return wx.showToast({ title: '手机号格式不正确', icon: 'none' });
    }

    this.setData({ submitting: true });
    request({
      url: '/applications/merchant',
      method: 'POST',
      data: this.data.formData
    }).then(() => {
      wx.showToast({ title: '申请提交成功，请等待审核', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    }).catch((err) => {
      wx.showToast({ title: err.data?.message || '提交失败', icon: 'none' });
    }).finally(() => {
      this.setData({ submitting: false });
    });
  }
});
