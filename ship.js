import { computeDestinationPoint } from 'geolib';

export class ShipPositionCalculator {
    constructor() {
        this.positions = []; // Массив с пеленгами и координатами
        this.speed = 0; // Скорость корабля в м/с
        this.course = 0; // Курс корабля в градусах
        this.timeLastUpdate = Date.now(); // Последнее время обновления
    }

    // Добавление новой пеленги с указанием времени замера
    addBearing(lat, lon, bearing, timestamp) {
        this.positions.push({
            coords: { latitude: lat, longitude: lon },
            bearing: bearing,
            timestamp: Date.now() - timestamp
        });
    }

    // Обновление скорости и курса корабля
    updateShipState(speed, course) {
        this.speed = speed; // м/с
        this.course = course; // градусы
        this.timeLastUpdate = Date.now();
    }

    // Рассчет новой позиции с учётом времени между замерами
    calculatePosition() {
        if (this.positions.length < 2) {
            throw new Error("Нужно как минимум два пеленга для определения местоположения.");
        }

        // Сортируем пеленги по времени замера
        this.positions.sort((a, b) => a.timestamp - b.timestamp);

        // Рассчитываем новую позицию с учётом времени между пеленгами
        let currentPosition = this.positions[0].coords;
        let currentTime = this.positions[0].timestamp;

        for (let i = 1; i < this.positions.length; i++) {
            const nextPosition = this.positions[i];
            const timeDiffSeconds = (nextPosition.timestamp - currentTime) / 1000; // Разница во времени в секундах

            // Расстояние, пройденное кораблём за это время
            const distanceTraveled = this.speed * timeDiffSeconds;

            // Рассчитываем новую позицию с учётом bearing (курса)
            currentPosition = computeDestinationPoint(currentPosition, distanceTraveled, this.course);

            // Обновляем текущее время на время следующего замера
            currentTime = nextPosition.timestamp;
        }

        return currentPosition;
    }
}