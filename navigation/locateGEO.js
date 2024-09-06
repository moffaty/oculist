import {
    getCenterOfBounds,
    computeDestinationPoint,
    getGreatCircleBearing,
} from 'geolib';

function findIntersection(lat1, lon1, lat2, lon2, d1, d2) {
    const point1 = { latitude: lat1, longitude: lon1 };
    const point2 = { latitude: lat2, longitude: lon2 };

    // Вычисляем начальную и конечную точки с использованием расстояний d1 и d2
    const intersectionPoints = getCenterOfBounds([
        computeDestinationPoint(
            point1,
            d1,
            getGreatCircleBearing(point1, point2)
        ),
        computeDestinationPoint(
            point2,
            d2,
            getGreatCircleBearing(point2, point1)
        ),
    ]);

    return intersectionPoints;
}

// Пример использования
const lat1 = 60.098320053331314;
const lon1 = 29.33367471302114;
const lat2 = 60.099076431941675;
const lon2 = 29.34408329821045;
const d1 = 480; // расстояние в метрах
const d2 = 523; // расстояние в метрах

const intersectionPoint = findIntersection(lat1, lon1, lat2, lon2, d1, d2);
console.log(
    `Искомая точка пересечения: ${intersectionPoint.latitude}, ${intersectionPoint.longitude}`
);
