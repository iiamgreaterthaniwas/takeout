import { config } from '../config';

const baseUrl = config.baseUrl;

export const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    let header = {
      'content-type': 'application/json',
      ...options.header
    };

    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: options.url.startsWith('http') ? options.url : baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // Token 失效
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.showToast({ title: '登录已过期', icon: 'none' });
          setTimeout(() => {
            wx.navigateTo({ url: '/pages/login/login' });
          }, 1500);
          reject(res);
        } else {
          wx.showToast({
            title: res.data.message || '请求错误',
            icon: 'none'
          });
          reject(res);
        }
      },
      fail(err) {
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
};
