import { request } from '../../../utils/request';

Page({
  data: {
    users: []
  },

  onShow() {
    this.fetchUsers();
  },

  fetchUsers() {
    wx.showLoading({ title: '加载中' });
    request({
      url: '/admin/users'
    }).then(res => {
      this.setData({ users: res });
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      wx.hideLoading();
    });
  },

  toggleStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    const newStatus = status === 'active' ? 'banned' : 'active';
    
    wx.showModal({
      title: '确认操作',
      content: `确定要${newStatus === 'banned' ? '封禁' : '解封'}该用户吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '操作中' });
          request({
            url: `/admin/users/${id}/status`,
            method: 'PUT',
            data: { status: newStatus }
          }).then(() => {
            wx.showToast({ title: '操作成功', icon: 'success' });
            this.fetchUsers();
          }).catch(() => {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }).finally(() => {
            wx.hideLoading();
          });
        }
      }
    });
  }
});
