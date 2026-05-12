import { request } from '../../../utils/request';
import { DistanceUtil } from '../../../utils/distance'; // 用于Haversine备用或前端ETA计算
import { config } from '../../../config';

const QQMapWX = require('../../../libs/qqmap-wx-jssdk.min.js'); // 引入腾讯地图SDK

Page({
  data: {
    latitude: 39.909160,
    longitude: 116.397428,
    scale: 14,
    markers: [],
    polyline: [],
    activeOrders: [], // 正在配送的订单
    currentIndex: 0, // 当前选中的订单索引
    qqmapsdk: null,
    tencentMapKey: config.tencentMapKey,
  },

  onLoad(options) {
    this.setData({ qqmapsdk: new QQMapWX({ key: this.data.tencentMapKey }) });

    // 如果有传入的查询参数（比如从订单详情或骑手工作台跳转过来）
    if (options) {
      let customMarkers = [];
      let customPolyline = [];

      // 设置当前骑手位置
      if (options.riderLat && options.riderLng) {
        this.setData({
          latitude: Number(options.riderLat),
          longitude: Number(options.riderLng)
        });
      }

      // 根据传入的店铺和用户坐标，直接构造地图
      if (options.shopLat && options.shopLng && options.userLat && options.userLng) {
        // 添加骑手起点（如果没传入就用当前位置）
        const riderLat = options.riderLat ? Number(options.riderLat) : this.data.latitude;
        const riderLng = options.riderLng ? Number(options.riderLng) : this.data.longitude;

        customMarkers.push({
          id: 0,
          latitude: riderLat,
          longitude: riderLng,
          iconPath: '/images/rider-location.png',
          width: 30,
          height: 30,
          callout: {
            content: '我的位置',
            color: '#ffffff',
            fontSize: 12,
            borderRadius: 10,
            padding: 8,
            bgColor: '#07C160',
            display: 'ALWAYS'
          }
        });

        // 添加商家标记
        customMarkers.push({
          id: 1,
          latitude: Number(options.shopLat),
          longitude: Number(options.shopLng),
          iconPath: '/images/default-shop.png',
          width: 25,
          height: 25,
          callout: {
            content: '取货点',
            color: '#333333',
            fontSize: 12,
            borderRadius: 10,
            padding: 8,
            bgColor: '#ffffff',
            display: 'ALWAYS'
          }
        });

        // 添加用户标记
        customMarkers.push({
          id: 2,
          latitude: Number(options.userLat),
          longitude: Number(options.userLng),
          iconPath: '/images/user-location.png',
          width: 30,
          height: 30,
          callout: {
            content: '送货点',
            color: '#ffffff',
            fontSize: 12,
            borderRadius: 10,
            padding: 8,
            bgColor: '#FF9800',
            display: 'ALWAYS'
          }
        });

        // 规划路线
        const origin = `${riderLat},${riderLng}`;
        let waypoints = '';
        let destination = '';

        // 根据 target 判断是先到商家还是直接到用户
        if (options.target === 'shop') {
          waypoints = `${options.shopLat},${options.shopLng}`;
          destination = `${options.userLat},${options.userLng}`;
        } else {
          // 如果 target=user 或者没指定，直接规划从骑手到用户（可以经过商家）
          waypoints = `${options.shopLat},${options.shopLng}`;
          destination = `${options.userLat},${options.userLng}`;
        }

        // 直接调用 API 规划路线
        wx.showLoading({ title: '规划路线中...' });
        this.data.qqmapsdk.direction({
          mode: 'driving',
          from: origin,
          to: destination,
          waypoints: waypoints,
          success: (res) => {
            if (res.status === 0) {
              const ret = res.result;
              const coors = ret.routes[0].polyline;
              const pl = [];
              for (let i = 2; i < coors.length; i++) {
                coors[i] = coors[i - 2] + coors[i] / 1000000;
              }
              for (let i = 0; i < coors.length; i += 2) {
                pl.push({
                  latitude: coors[i],
                  longitude: coors[i + 1]
                });
              }
              customPolyline = [{
                points: pl,
                color: '#07C160',
                width: 6,
                arrowLine: true
              }];
            } else {
              console.error('路线规划失败', res);
            }
          },
          fail: (err) => {
            console.error('腾讯地图API调用失败', err);
          },
          complete: () => {
            this.setData({ markers: customMarkers, polyline: customPolyline });
            wx.hideLoading();
          }
        });
      }
    }
  },

  onShow() {
    this.getUserLocation();
    this.fetchActiveOrders();
  },

  goBack() {
    wx.navigateBack();
  },

  refreshData() {
    this.getUserLocation();
    this.fetchActiveOrders();
  },

  // 获取用户当前位置
  getUserLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
        });
      },
      fail: (err) => {
        console.error('获取位置失败', err);
        wx.showToast({ title: '获取位置失败，请检查定位权限', icon: 'none' });
      }
    });
  },

  // 获取正在配送的订单
  fetchActiveOrders() {
    wx.showLoading({ title: '加载中' });
    request({
      url: '/riders/my/active-orders'
    }).then(res => {
      // 对订单进行排序，例如按距离或时间
      const sortedOrders = this.sortOrders(res);

      const formattedOrders = sortedOrders.map(order => ({
        ...order,
        shopName: order.merchant?.shopName || '某商店',
        customerName: (order.user && order.user.nickname) || '用户',
        distanceDisplay: order.distanceToUser ? `${order.distanceToUser}km` : '计算中...',
        eta: '计算中...'
      }));
      this.setData({ activeOrders: formattedOrders });
      wx.hideLoading();

      if (formattedOrders.length > 0) {
        this.updateMapMarkers();
        this.calculateRouteAndETA();
      }
    }).catch(err => {
      console.error('Fetch Active Orders Error:', err);
      wx.showToast({ title: '获取订单失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  // 订单排序 (示例：这里可以根据实际需求调整排序逻辑，例如：先去商家取货，再按送达距离排序)
  sortOrders(orders) {
    // 假设所有订单都已取货，直接按距离排序（从骑手当前位置到用户位置）
    // 更复杂的逻辑可能需要考虑取货点和送货点
    if (!this.data.latitude || !this.data.longitude) return orders; // 如果没有当前位置，不排序

    return orders.sort((a, b) => {
      const distA = DistanceUtil.calculateDistance(
        this.data.latitude, this.data.longitude,
        a.lat, a.lng
      );
      const distB = DistanceUtil.calculateDistance(
        this.data.latitude, this.data.longitude,
        b.lat, b.lng
      );
      return distA - distB;
    });
  },

  // 更新地图上的标记点
  updateMapMarkers() {
    const { latitude, longitude, activeOrders } = this.data;
    const markers = [{
      id: 0,
      latitude: latitude,
      longitude: longitude,
      iconPath: '/images/rider-location.png',
      width: 30,
      height: 30,
      callout: {
        content: '我的位置',
        color: '#ffffff',
        fontSize: 12,
        borderRadius: 10,
        padding: 8,
        bgColor: '#07C160',
        display: 'ALWAYS'
      }
    }];

    activeOrders.forEach((order, index) => {
      // 商家取货点
      if (order.merchant?.lat && order.merchant?.lng) {
        markers.push({
          id: `shop-${order.id}`,
          latitude: order.merchant.lat,
          longitude: order.merchant.lng,
          iconPath: '/images/default-shop.png',
          width: 25,
          height: 25,
          callout: {
            content: `取货 ${order.shopName}`,
            color: '#333333',
            fontSize: 12,
            borderRadius: 10,
            padding: 8,
            bgColor: '#ffffff',
            display: 'ALWAYS'
          }
        });
      }

      // 用户送货点
      markers.push({
        id: order.id,
        latitude: order.lat,
        longitude: order.lng,
        iconPath: '/images/user-location.png',
        width: 30,
        height: 30,
        callout: {
          content: `${index + 1}. 送往 ${order.customerName}`,
          color: '#ffffff',
          fontSize: 12,
          borderRadius: 10,
          padding: 8,
          bgColor: '#FF9800',
          display: 'ALWAYS'
        }
      });
    });

    this.setData({ markers });
  },

  // 计算路线和预估时间
  calculateRouteAndETA() {
    const { latitude, longitude, activeOrders, qqmapsdk, tencentMapKey } = this.data;
    if (activeOrders.length === 0 || !qqmapsdk) return;

    // 构造起点和终点，以及途径点
    const origin = `${latitude},${longitude}`;
    // 目的地设置为最后一个订单的用户地址
    const destination = `${activeOrders[activeOrders.length - 1].lat},${activeOrders[activeOrders.length - 1].lng}`;

    // 途径点：从第一个订单开始到倒数第二个订单的用户地址
    const waypoints = activeOrders.slice(0, activeOrders.length - 1).map(order => `${order.lat},${order.lng}`).join(';');
    
    wx.showLoading({ title: '规划路线中...' });
    qqmapsdk.direction({
      mode: 'driving', // 使用驾车模式，虽然是电动车，但驾车模式路线规划更可靠，再根据电动车速度修正时间
      from: origin,
      to: destination,
      waypoints: waypoints,
      success: (res) => {
        if (res.status === 0) {
          const ret = res.result;
          const coors = ret.routes[0].polyline;
          const pl = [];
          // 抽取路线坐标
          for (let i = 2; i < coors.length; i++) {
            coors[i] = coors[i - 2] + coors[i] / 1000000;
          }
          for (let i = 0; i < coors.length; i += 2) {
            pl.push({
              latitude: coors[i],
              longitude: coors[i + 1]
            });
          }

          const polyline = [{
            points: pl,
            color: '#07C160',
            width: 6,
            arrowLine: true
          }];
          this.setData({ polyline });

          // 更新每个订单的ETA，考虑电动车速度
          this.updateOrdersETAWithDrivingData(ret.routes[0].duration, ret.routes[0].distance);

        } else if (res.status === 347) { // KEY超限
          wx.showToast({ title: '地图API Key超限，使用直线距离估算', icon: 'none' });
          this.calculateFallbackETA();
        } else {
          console.error('路线规划失败', res);
          wx.showToast({ title: '路线规划失败，使用直线距离估算', icon: 'none' });
          this.calculateFallbackETA();
        }
      },
      fail: (err) => {
        console.error('腾讯地图API调用失败', err);
        wx.showToast({ title: '路线规划失败，使用直线距离估算', icon: 'none' });
        this.calculateFallbackETA();
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 使用直线距离作为备用计算ETA
  calculateFallbackETA() {
    const { latitude, longitude, activeOrders } = this.data;
    if (!latitude || !longitude || activeOrders.length === 0) return;

    const updatedOrders = activeOrders.map(order => {
      const distance = DistanceUtil.calculateDistance(latitude, longitude, order.lat, order.lng);
      // 电动车平均速度20km/h，加上10分钟的取餐送餐缓冲时间
      const etaMinutes = DistanceUtil.estimateArrivalTime(distance, 20) + 10; 
      return {
        ...order,
        distanceDisplay: `${distance}km`,
        eta: `${etaMinutes}分钟`
      };
    });
    this.setData({ activeOrders: updatedOrders });
  },

  // 根据API返回的总时长和总距离，更新每个订单的ETA
  updateOrdersETAWithDrivingData(totalDurationSeconds, totalDistanceMeters) {
    const { activeOrders } = this.data;
    const totalDistanceKm = totalDistanceMeters / 1000;
    
    // 假设电动车速度比汽车慢一些，例如汽车速度的0.6倍，并增加固定送餐时间
    const electricBikeSpeedFactor = 0.6; // 电动车相对于汽车的速度因子
    const additionalTimePerOrder = 5; // 每个订单额外增加的取餐送餐时间（分钟）

    const estimatedElectricBikeDurationSeconds = totalDurationSeconds / electricBikeSpeedFactor;
    let accumulatedTime = 0;

    const updatedOrders = activeOrders.map((order, index) => {
      // 更精确的分配需要复杂的路径分析，这里简化为根据订单在序列中的位置进行分配
      // 可以假设每个订单的配送时间是平均分配 + 额外固定时间
      const singleOrderDrivingTime = (estimatedElectricBikeDurationSeconds / activeOrders.length) / 60; // 单个订单的平均驾驶时间
      accumulatedTime += singleOrderDrivingTime + additionalTimePerOrder;

      return {
        ...order,
        // 假设每个订单是顺序送达，所以ETA是累加的
        eta: `${Math.ceil(accumulatedTime)}分钟` 
      };
    });
    this.setData({ activeOrders: updatedOrders });
  },

  setCurrentTask(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentIndex: index });
    // 可以在这里重新定位地图到当前任务点
  },

  navigateToCurrent() {
    const { activeOrders, currentIndex, latitude, longitude } = this.data;
    if (activeOrders.length === 0) return;

    const targetOrder = activeOrders[currentIndex];
    if (targetOrder && targetOrder.lat && targetOrder.lng) {
      // 只是把地图中心移到目标点，不跳转其他应用
      this.setData({
        latitude: targetOrder.lat,
        longitude: targetOrder.lng,
        scale: 17
      });
    } else {
      wx.showToast({ title: '目标订单位置信息缺失', icon: 'none' });
    }
  },

  onMarkerTap(e) {
    const markerId = e.markerId;
    // 如果点击的是我的位置，不做处理
    if (markerId === 0) return;

    // 找到对应的订单或商家标记
    const { activeOrders } = this.data;
    const order = activeOrders.find(o => o.id === markerId || `shop-${o.id}` === markerId);
    if (order) {
      const index = activeOrders.findIndex(o => o.id === order.id);
      this.setData({ currentIndex: index });
      // 可以在这里弹出订单详情或者其他操作
    }
  }
});
