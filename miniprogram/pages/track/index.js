Page({
  data: {
    orderId: '',
    latitude: 39.90469,
    longitude: 116.40717,
    circles: [],
    riderName: '王师傅',
    distance: '850'
  },

  onLoad(options) {
    if (options.orderId) {
      this.orderId = options.orderId;
      this.setData({ orderId: options.orderId });
      this.initLocation();
      this.initSocket();
    }
  },

  initLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
      }
    });
  },

  initSocket() {
    const app = getApp();
    if (app.socket) {
      app.socket.send({
        data: JSON.stringify({ event: 'join_order', data: this.orderId })
      });

      this.mockTimer = setInterval(() => {
        const newLat = this.data.latitude + (Math.random() - 0.5) * 0.005;
        const newLng = this.data.longitude + (Math.random() - 0.5) * 0.005;

        this.setData({
          circles: [{
            latitude: newLat,
            longitude: newLng,
            color: '#ff572280',
            fillColor: '#ff572240',
            radius: 30,
            strokeWidth: 4
          }],
          distance: Math.floor(Math.random() * 500 + 100) // mock distance
        });
      }, 3000);
    }
  },

  onUnload() {
    if (this.mockTimer) {
      clearInterval(this.mockTimer);
    }
    const app = getApp();
    if (app.socket) {
      app.socket.send({
        data: JSON.stringify({ event: 'leave_order', data: this.orderId })
      });
    }
  }
});
