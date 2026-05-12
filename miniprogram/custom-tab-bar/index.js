Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#FFCC00",
    tabs: []
  },
  attached() {
    this.refreshTabs();
  },
  methods: {
    refreshTabs() {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const role = userInfo.role || 'user';
      
      const base = [
        { text: '首页', icon: '🏠', path: 'pages/index/index' },
        { text: '订单', icon: '📝', path: 'pages/order/list/index' },
        { text: '我的', icon: '👤', path: 'pages/profile/index' },
      ];
      
      this.setData({ tabs: base });
    },
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = '/' + data.path;
      wx.switchTab({ url });
      this.setData({
        selected: data.index
      });
    }
  }
})
