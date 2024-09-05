const toRadians = (degree) => (degree * Math.PI) / 180;
const toDegrees = (radian) => (radian * 180) / Math.PI;

// Функция для вычисления второй точки
export function calculateDestination (lat1, lon1, distance, bearing, radius = 6371) {
  // Преобразуем широту, долготу и азимут (bearing) в радианы
  const φ1 = toRadians(lat1);
  const λ1 = toRadians(lon1);
  const θ = toRadians(bearing);

  // Преобразуем расстояние в радианы
  const δ = distance / radius;

  // Формула для новой широты (φ2)
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));

  // Формула для новой долготы (λ2)
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  );

  // Преобразуем результат обратно в градусы
  const lat2 = toDegrees(φ2);
  const lon2 = toDegrees(λ2);

  return {
    latitude: lat2,
    longitude: lon2
  };
};

// Пример использования
// const lat1 = 55.751244; // Широта первой точки (Москва)
// const lon1 = 37.618423; // Долгота первой точки (Москва)
// const distance = 5; // Расстояние в километрах
// const bearing = 90; // Азимут в градусах (направление на восток)

// const result = calculateDestination(lat1, lon1, distance, bearing);
