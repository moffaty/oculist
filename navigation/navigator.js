// OptiVessel
import LatLon, { Dms } from 'geodesy/latlon-spherical.js';
import { Ride } from '../db.js';

const Radius = 6371;

function parseStr(input) {
    return input.replace(/[0-9.]/g, '').trim(); // Удаляет все цифры и точки
}

export class Navigator {
    constructor(name) {
        this.rideName = name;
        this.points = [];
        this.speed = 0; // нужно из GPS определить
        this.course = 0; // нужно из GPS определить
        this.fullTime = 0;
        setInterval(() => {
            this.fullTime += 1;
        }, 1000);
        this.id = null;
        this.startPoint = new Point(1, 1, 1);
        this.createRide(name, this.startPoint);
    }

    async createRide(name, startPoint) {
        try {
            this.ride = await Ride.create({
                name: name,
                latitudeStart: startPoint.lat,
                longitudeStart: startPoint.lon,
            });
            this.id = this.ride.id;
            console.log(`Ride создан с ID: ${this.id}`);
        } catch (error) {
            console.error('Ошибка при создании Ride:', error);
        }
    }

    addPoint(point) {
        this.points.push(point);
    }

    endRide() {
        // внести время, конечную точку
        console.log('Следование завершено');
        this.ride.rideTime = this.fullTime;
        console.log(this.fullTime);
        this.ride.save();
    }

    /**
     *
     * @param {Point} p1
     * @param {Point} p2
     * @param {Number} distance
     */
    getPosition(p1, p2 = NaN, distance = NaN) {
        if (p1 && p2) {
            return Point.findIntersection(p1, p2);
        } else if (p1 && distance) {
            return p1.calculateDirection(distance);
        }
    }
}

export class Point {
    constructor(lat, lon, bearing) {
        this._lat = Dms.parse(lat);
        this._lon = Dms.parse(lon);
        this._bearing = Dms.parse(bearing);
        this.time = Number(Date.now());
    }

    updateTime() {
        this.time = Number(Date.now());
    }

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

    #convertToKmh(speed, unit) {
        switch (unit.toLowerCase()) {
            case 'км/ч': // Километры в час
            case 'km/h':
                return speed;
            case 'м/с': // Метры в секунду
            case 'm/s':
                return speed * 3.6; // 1 м/с = 3.6 км/ч
            case 'узлы': // Узлы (knots)
            case 'knots':
                return speed * 1.852; // 1 узел = 1.852 км/ч
            default:
                throw new Error('Неизвестная единица измерения скорости');
        }
    }

    // Функция перемещения на основе скорости и азимута
    move(speed) {
        const speedValue = parseFloat(speed); // Извлекаем число
        const speedType = parseStr(speed); // Извлекаем единицу измерения

        // Конвертируем скорость в километры в час
        const speedInKmh = convertToKmh(speedValue, speedType);

        // Логика перемещения с учетом скорости в км/ч
        const distance =
            (speedInKmh * (Number(Date.now()) - this.time)) / 3600000; // Преобразуем время в часы
        console.log('Пройденное расстояние:', distance);
        const startPoint = new LatLon(this.lat, this.lon);
        const newPoint = startPoint.destinationPoint(distance, this.bearing); // Расстояние в километрах
        this.lat = newPoint.lat;
        this.lon = newPoint.lon;
        this.updateTime();
    }

    // Рассчет новой точки на основе текущей позиции, азимута и расстояния
    /**
     *
     * @param {Number} distance
     * @returns
     */
    calculateDirection(distance) {
        const φ1 = this.toRadians(this.lat);
        const λ1 = this.toRadians(this.lon);
        const θ = this.toRadians(this.bearing);

        const δ = distance / Radius;

        const φ2 = Math.asin(
            Math.sin(φ1) * Math.cos(δ) +
                Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
        );

        const λ2 =
            λ1 +
            Math.atan2(
                Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
                Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
            );

        const lat2 = this.toDegrees(φ2);
        const lon2 = this.toDegrees(λ2);

        return new Point(lat2, lon2, this.bearing);
    }

    // Поиск пересечения между двумя точками
    /**
     *
     * @param {Point} p1
     * @param {Point} p2
     * @returns Местонахождение или false если нет пересечений
     */
    static findIntersection(p1, p2) {
        const point1 = new LatLon(p1.lat, p1.lon);
        const point2 = new LatLon(p2.lat, p2.lon);
        const bearing1 = Dms.parse(p1.bearing);
        const bearing2 = Dms.parse(p2.bearing);

        try {
            const pInt = LatLon.intersection(
                point1,
                bearing1,
                point2,
                bearing2
            );
            if (!pInt) return false;
            return pInt;
        } catch (error) {
            return false;
        }
    }

    // Поиск пересечения для множества точек
    static findIntersectionMultiple(...points) {
        if (points.length < 2) {
            throw new Error('Для поиска пересечения нужно минимум две точки');
        }

        // Изначально задаём пересечение между первыми двумя точками
        let intersection = Point.findIntersection(points[0], points[1]);

        // Если не найдено пересечение для первых двух точек, то дальнейший поиск не имеет смысла
        if (!intersection) return false;

        // Проходим по оставшимся точкам и ищем пересечения
        for (let i = 2; i < points.length; i++) {
            const nextPoint = new LatLon(points[i].lat, points[i].lon);
            const nextBearing = Dms.parse(points[i].bearing);

            try {
                intersection = LatLon.intersection(
                    intersection,
                    nextBearing,
                    nextPoint,
                    nextBearing
                );
                if (!intersection) return false; // Если пересечения нет, возвращаем false
            } catch (error) {
                return false;
            }
        }

        return intersection; // Возвращаем финальную точку пересечения
    }

    // Вспомогательные функции для перевода радианов в градусы и обратно
    toRadians(degrees) {
        return (degrees * Math.PI) / 180;
    }

    toDegrees(radians) {
        return (radians * 180) / Math.PI;
    }
}

// Пример использования:
// const p1 = new Point(51.8853, 0.2545, 108.55);
// const p2 = new Point(49.0034, 2.5735, 32.44);

// const speed1 = 30; // Скорость в узлах (1 узел = 1.852 км/ч)
// const speed2 = 25;

// p1.move(speed1 * 1.852); // Distance = speed * time * 1.852 (перевод в километры)
// p2.move(speed2 * 1.852);

// console.log(Point.findIntersection(p1, p2));