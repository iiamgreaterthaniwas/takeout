import { request } from '../../../utils/request';

Page({
  data: {
    orderId: '',
    rating: 5,
    content: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ orderId: options.id });
    }
  },

  setRating(e) {
    const rating = parseInt(e.currentTarget.dataset.score);
    this.setData({ rating });
  },

  onInput(e) {
    this.setData({ content: e.detail.value });
  },

  submitReview() {
    if (!this.data.orderId) return;
    
    wx.showLoading({ title: '提交中' });
    request({
      url: `/reviews/order/${this.data.orderId}`,
      method: 'POST',
      data: {
        rating: this.data.rating,
        content: this.data.content
      }
    }).then(() => {
      wx.showToast({ title: '评价成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: err.data?.message || '评价失败', icon: 'none' });
    });
  }
});