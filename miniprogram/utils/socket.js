export const connectSocket = (url, token) => {
  // 后端使用的是 socket.io，它的默认 path 是 /socket.io/，我们需要拼接上相关的参数以便能连接
  const socketUrl = url.replace('http', 'ws') + '/socket.io/?EIO=4&transport=websocket';
  
  const socketTask = wx.connectSocket({
    url: socketUrl,
    header: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    success: () => {
      console.log('wx.connectSocket success');
    }
  });

  if (socketTask) {
    socketTask.onOpen && socketTask.onOpen(() => {
      console.log('WebSocket 连接打开');
    });

    socketTask.onMessage && socketTask.onMessage((res) => {
      console.log('收到服务器内容：' + res.data);
    });

    socketTask.onError && socketTask.onError((err) => {
      console.error('WebSocket 连接发生错误：', err);
    });
  } else {
    wx.onSocketOpen(() => {
      console.log('WebSocket 连接打开');
    });
    wx.onSocketMessage((res) => {
      console.log('收到服务器内容：' + res.data);
    });
    wx.onSocketError((err) => {
      console.error('WebSocket 连接发生错误：', err);
    });
  }

  return socketTask || {
    send: (options) => wx.sendSocketMessage(options),
    close: (options) => wx.closeSocket(options)
  };
};
