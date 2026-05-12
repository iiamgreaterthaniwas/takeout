import { request } from '../../../utils/request';

Page({
  data: {
    activeTab: 0,
    merchantApps: [],
    riderApps: [],
    products: []
  },

  onShow() {
    this.fetchData();
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.index });
  },

  fetchData() {
    wx.showLoading({ title: '加载中' });
    Promise.all([
      request({ url: '/applications/merchant' }),
      request({ url: '/applications/rider' }),
      request({ url: '/products/admin' })
    ]).then(([m, r, p]) => {
      this.setData({
        merchantApps: m,
        riderApps: r,
        products: p
      });
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      wx.hideLoading();
    });
  },

  previewImg(e) {
    const url = e.currentTarget.dataset.url;
    if (url) wx.previewImage({ urls: [url] });
  },

  handleReview(e) {
    const { type, id, status } = e.currentTarget.dataset;
    if (status === 'rejected') {
      wx.showModal({
        title: '填写原因',
        editable: true,
        placeholderText: '请输入拒绝/下架原因',
        success: (res) => {
          if (res.confirm) {
            this.submitReview(type, id, status, res.content);
          }
        }
      });
    } else {
      this.submitReview(type, id, status);
    }
  },

  submitReview(type, id, status, rejectReason = '') {
    wx.showLoading({ title: '提交中' });
    let url = '';
    let data = { status, rejectReason };
    if (type === 'merchant') url = `/applications/merchant/${id}/review`;
    if (type === 'rider') url = `/applications/rider/${id}/review`;
    if (type === 'product') url = `/products/admin/${id}/review`;

    request({
      url,
      method: 'PUT',
      data
    }).then(() => {
      wx.showToast({ title: '操作成功', icon: 'success' });
      this.fetchData();
    }).catch(err => {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  }
});
