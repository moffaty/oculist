// Инициализация карты
const map = L.map('map').setView([60.16952, 24.93545], 6); // Центр карты на Хельсинки

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Добавляем обработчик ПКМ (contextmenu)
map.on('contextmenu', function (e) {
    // Координаты клика
    var latlng = e.latlng;

    // Создаем временный маркер
    var marker = L.marker(latlng).addTo(map);

    // Создаем popup с ссылкой "Создать метку?"
    var popupContent = '<a href="#" id="create-marker">Добавить пеленг?</a>';

    // Открываем popup на маркере
    marker.bindPopup(popupContent).openPopup();

    // Обрабатываем нажатие на ссылку в popup
    var link = document.getElementById('create-marker');
    if (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            // Снимаем привязку popup и обновляем содержимое маркера
            marker.unbindPopup(); // Убираем popup
            marker.bindPopup('Метка создана!').openPopup();
            addBearing(marker, { latitude: latlng.lat, longitude: latlng.lng });

            // Дополнительные действия при создании метки
            console.log('Метка создана в координатах:', latlng);
        });
    }

    // Удаление маркера, если popup закрыт (и пользователь не нажал на ссылку)
    marker.on('popupclose', function () {
        if (marker._popup._content.includes('Добавить пеленг?')) {
            map.removeLayer(marker);
        }
    });
});

document.getElementsByClassName('leaflet-control-attribution')[0].textContent =
    'Окулист';
let bearingMarkers = [];
let shipMarker = null;

let socket = new WebSocket('ws://localhost:9999');

socket.onopen = (e) => {
    console.log('opened');
};

socket.onmessage = (e) => {
    const position = JSON.parse(e.data);
    // updateShipPosition(position);
};

// Функция для загрузки пеленгов с сервера
async function getBearings() {
    try {
        const response = await fetch('/get-bearing');
        const result = await response.json();
        console.log(result);
        if (result && result.length > 0) {
            result.forEach((mark) => {
                // Создаем маркер
                const marker = L.marker([mark.latitude, mark.longitude], {
                    id: mark.id,
                })
                    .addTo(map)
                    .bindPopup(
                        `
                        Пеленг<br>
                        <a href="#" class="delete-marker" data-id="${mark.id}">Удалить</a>
                    `
                    )
                    .openPopup();

                // Добавляем маркер в массив
                bearingMarkers.push(marker);
            });
        }

        // Добавляем обработчик кликов на ссылки удаления
        document.addEventListener('click', async function (event) {
            if (event.target.classList.contains('delete-marker')) {
                event.preventDefault();
                const markerId = event.target.getAttribute('data-id');
                await deleteMarker(markerId);
            }
        });
    } catch (error) {
        console.error('Error adding bearing:', error);
    }
}

// Функция для удаления метки
async function deleteMarker(id) {
    try {
        // Отправляем запрос на сервер для удаления метки
        const response = await fetch(`/delete-bearing/${id}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            // Удаляем метку с карты
            const markerToRemove = bearingMarkers.find(
                (marker) => marker.options.id === Number(id)
            );
            if (markerToRemove) {
                map.removeLayer(markerToRemove);
                bearingMarkers = bearingMarkers.filter(
                    (marker) => marker !== markerToRemove
                );
            }
            console.log('Marker deleted successfully');
        } else {
            console.error('Failed to delete marker');
        }
    } catch (error) {
        console.error('Error deleting marker:', error);
    }
}

// Функция для добавления пеленга на сервер
async function addBearing(marker, bearingData) {
    console.log(bearingData);
    try {
        const response = await fetch('/add-bearing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bearingData),
        });

        const result = await response.json();
        marker
            .bindPopup(
                `
            Пеленг<br>
            <a href="#" class="delete-marker" data-id="${result.bearing.id}">Удалить</a>
        `
            )
            .openPopup();
        bearingMarkers.push(marker);
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
