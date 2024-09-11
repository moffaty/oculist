import LatLon, { Dms } from 'geodesy/latlon-spherical.js';

export class Point {
    /**
     *
     * @param {number} lat
     * @param {number} lon
     * @param {number} bearing
     */
    constructor(lat, lon, bearing) {
        this._lat = Dms.parse(lat);
        this._lon = Dms.parse(lon);
        this._bearing = Dms.parse(bearing);
        this.time = Number(Date.now());
    }

    updateTime() {
        this.time = Number(Date.now());
    }

    // Геттеры и сеттеры для lat, lon и bearing
    get lat() {
        return this._lat;
    }

    set lat(value) {
        this._lat = Dms.parse(value);
        this.updateTime();
    }

    get lon() {
        return this._lon;
    }

    set lon(value) {
        this._lon = Dms.parse(value);
        this.updateTime();
    }

    get bearing() {
        return this._bearing;
    }

    set bearing(value) {
        this._bearing = Dms.parse(value);
        this.updateTime();
    }

    // Функция перемещения по азимуту на определённое расстояние
    move(speed, bearing) {
        const distance = (speed * (Number(Date.now()) - this.time)) / 3600000; // Перевод времени в часы
        console.log('Пройденное расстояние:', distance);
        const startPoint = new LatLon(this.lat, this.lon);
        const newPoint = startPoint.destinationPoint(distance, bearing); // Расстояние в километрах
        this.lat = newPoint.lat;
        this.lon = newPoint.lon;
        this.updateTime();
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

// Пример использования:
// const p1 = new Point(51.8853, 0.2545, 108.55);
// const p2 = new Point(49.0034, 2.5735, 32.44);

// const speed1 = 30; // Скорость в узлах (1 узел = 1.852 км/ч)
// const speed2 = 25;

// // Движение объектов перед вторым замером
// p1.move(speed1 * 1.852, 108.55); // Distance = speed * time * 1.852 (перевод в километры)
// p2.move(speed2 * 1.852, 32.44);

// console.log(findIntersection(p1, p2));
