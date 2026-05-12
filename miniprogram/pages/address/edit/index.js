import { request } from '../../../utils/request';

Page({
  data: {
    id: null,
    form: {
      name: '',
      phone: '',
      address: '',
      detail: '',
      lat: null,
      lng: null,
      isDefault: false
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: Number(options.id) });
      wx.setNavigationBarTitle({ title: '编辑地址' });
      this.fetchDetail(Number(options.id));
    } else {
      wx.setNavigationBarTitle({ title: '新增地址' });
    }
  },

  fetchDetail(id) {
    request({
      url: `/addresses/${id}`,
      method: 'GET'
    }).then((res) => {
      this.setData({
        form: {
          name: res.name,
          phone: res.phone,
          address: res.address,
          detail: res.detail,
          lat: res.lat,
          lng: res.lng,
          isDefault: !!res.isDefault
        }
      });
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  onDefaultChange(e) {
    this.setData({
      'form.isDefault': e.detail.value
    });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.address': res.name || res.address,
          'form.lat': res.latitude,
          'form.lng': res.longitude
        });
      },
      fail: (err) => {
        if ((err.errMsg || '').includes('auth')) {
          wx.openSetting();
        }
      }
    });
  },

  submit() {
    const { id, form } = this.data;
    if (!form.name || !form.phone || !form.address || !form.detail) {
      wx.showToast({ title: '请完善地址信息', icon: 'none' });
      return;
    }

    const payload = { ...form };
    request({
      url: id ? `/addresses/${id}` : '/addresses',
      method: id ? 'PUT' : 'POST',
      data: payload
    }).then(() => {
      wx.showToast({ title: id ? '修改成功' : '新增成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 500);
    });
  }
});
