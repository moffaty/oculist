import LatLon, { Dms } from 'geodesy/latlon-spherical.js';

export class Point {
    constructor(lat, lon, bearing) {
        this.lat = Dms.parse(lat);
        this.lon = Dms.parse(lon);
        this.bearing = Dms.parse(bearing);
        return { lat, lon, bearing };
    }
}

export function findIntersection(p1, p2) {
    const point1 = new LatLon(p1.lat, p1.lon);
    const point2 = new LatLon(p2.lat, p2.lon);
    const bearing1 = Dms.parse(p1.bearing);
    const bearing2 = Dms.parse(p2.bearing);

    try {
        const pInt = LatLon.intersection(point1, bearing1, point2, bearing2);
        if (!pInt) return false;
        return pInt;
    } catch (error) {
        return false;
    }
}

// const p1 = new Point(51.8853, 0.2545, 108.55);
// const p2 = new Point(49.0034, 2.5735, 32.44);
// console.log(findIntersection(p1, p2))
