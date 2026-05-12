"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistanceUtil = void 0;
class DistanceUtil {
    static calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
                Math.cos(this.toRadians(lat2)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return Number(distance.toFixed(2));
    }
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}
exports.DistanceUtil = DistanceUtil;
//# sourceMappingURL=distance.util.js.map