console.log('upload.js is loading...');

const uploadFile = (tempFilePath) => {
  return new Promise((resolve, reject) => {
    const app = getApp();
    const baseUrl = (app && app.globalData && app.globalData.baseUrl) || 'http://127.0.0.1:3000';
    const token = wx.getStorageSync('token');
    
    wx.uploadFile({
      url: baseUrl + '/upload',
      filePath: tempFilePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success(res) {
        if (res.statusCode === 201 || res.statusCode === 200) {
          try {
            const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            if (data.url) {
              resolve(data.url);
            } else {
              reject(new Error('上传返回数据格式错误'));
            }
          } catch (e) {
            console.error('解析上传结果失败', e);
            reject(e);
          }
        } else {
          reject(res);
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
};

module.exports = {
  uploadFile
};


