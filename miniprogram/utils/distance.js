export class DistanceUtil {
  /**
   * 计算两个经纬度之间的距离（单位：公里）
   * 使用 Haversine 公式
   */
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球半径（公里）
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * 
      Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng / 2) * 
      Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // 距离（公里）
    
    return Number(distance.toFixed(2)); // 保留两位小数
  }

  /**
   * 将角度转换为弧度
   */
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * 计算预估时间（分钟）
   * @param {number} distance - 距离（公里）
   * @param {number} avgSpeed - 平均速度（公里/小时），默认 30
   */
  static estimateArrivalTime(distance, avgSpeed = 30) {
    const hours = distance / avgSpeed;
    return Math.round(hours * 60);
  }
}
