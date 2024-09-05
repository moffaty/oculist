// Инициализация карты
const map = L.map('map').setView([60.16952, 24.93545], 6); // Центр карты на Хельсинки

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

let bearingMarkers = [];
let shipMarker = null;

let socket = new WebSocket('ws://localhost:9999');

socket.onopen = (e) => {
    console.log('opened');
};

socket.onmessage = (e) => {
    const position = JSON.parse(e.data);
    updateShipPosition(position);
};

// Функция для загрузки пеленгов с сервера
async function getBearings() {
    try {
        const response = await fetch('/get-bearing');
        const result = await response.json();
        console.log(result);
        if (result && result.length > 0) {
            result.forEach((mark) => {
                const marker = L.marker([mark.latitude, mark.longitude])
                    .addTo(map)
                    .bindPopup(`Пеленг: ${mark.bearing}°`)
                    .openPopup();

                bearingMarkers.push(marker);
            });
        }
    } catch (error) {
        console.error('Error adding bearing:', error);
    }
}

// Функция для добавления пеленга на сервер
async function addBearing(bearingData) {
    try {
        const response = await fetch('/add-bearing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bearingData),
        });

        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.error('Error adding bearing:', error);
    }
}

// Функция для обновления позиции корабля на карте
function updateShipPosition(position) {
    const { latitude, longitude } = position;

    if (shipMarker) {
        map.removeLayer(shipMarker);
    }

    // Обновляем маркер позиции корабля
    shipMarker = L.marker([latitude, longitude], { color: 'red' })
        .addTo(map)
        .bindPopup('Текущее местоположение корабля')
        .openPopup();

    // map.setView([latitude, longitude]);
}

// Обработчик отправки формы
document
    .getElementById('bearing-form')
    .addEventListener('submit', function (event) {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const latitude = parseFloat(document.getElementById('latitude').value);
        const longitude = parseFloat(
            document.getElementById('longitude').value
        );
        const bearing = parseFloat(document.getElementById('bearing').value);
        const destination = parseFloat(
            document.getElementById('destination').value
        );

        // Данные для отправки
        const bearingData = {
            name,
            latitude,
            longitude,
            bearing,
            destination,
        };

        // Добавляем пеленг на сервер
        addBearing(bearingData);

        // Добавляем маркер пеленга на карту
        const marker = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(`Пеленг: ${bearing}°`)
            .openPopup();

        bearingMarkers.push(marker);

        // Закрываем модальное окно после отправки формы
        $('#addBearingModal').modal('hide');

        // Очищаем форму
        event.target.reset();
    });

getBearings();
