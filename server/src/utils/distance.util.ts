export class DistanceUtil {
  /**
   * 计算两个经纬度之间的距离（单位：公里）
   * 使用 Haversine 公式
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
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
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
