import { request } from '../../utils/request';

Page({
  data: {
    formData: {
      realName: '',
      idCard: '',
      vehicleType: '',
      idCardImg: ''
    },
    vehicles: ['电动车', '自行车', '步行'],
    vehicleIndex: -1,
    submitting: false
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  bindVehicleChange(e) {
    const index = e.detail.value;
    this.setData({
      vehicleIndex: index,
      'formData.vehicleType': this.data.vehicles[index]
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
      url: getApp().globalData.baseUrl + '/upload?type=id-cards',
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        wx.hideLoading();
        const data = JSON.parse(res.data);
        if (data.url) {
          this.setData({ 'formData.idCardImg': data.url });
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
    const { realName, idCard, vehicleType, idCardImg } = this.data.formData;
    if (!realName || !idCard || !vehicleType || !idCardImg) {
      return wx.showToast({ title: '请完整填写所有信息并上传证件照', icon: 'none' });
    }
    // 简单的身份证正则校验
    if (!/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard)) {
      return wx.showToast({ title: '身份证号格式不正确', icon: 'none' });
    }

    this.setData({ submitting: true });
    request({
      url: '/applications/rider',
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
