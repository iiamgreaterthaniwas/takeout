import { connectSocket } from './utils/socket';
import { config } from './config';

App({
  onLaunch() {
    // 登录
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      this.connectSocket();
    }
  },
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: config.baseUrl
  },
  connectSocket() {
    if (this.socket) return;
    this.socket = connectSocket(this.globalData.baseUrl, this.globalData.token);
  }
})
