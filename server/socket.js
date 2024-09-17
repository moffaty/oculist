import { WebSocketServer } from 'ws';
import { logger } from './config.js';
import { gps, camera1, camera2 } from './devices.js';
import { Navigator } from '../navigation/navigator.js';

// Создаем WebSocket сервер на порту 9999
const wsServer = new WebSocketServer({ port: 9999 });

const navigation = new Navigator('test');
navigation.cameras = [camera1, camera2];
export function setupWebSocket() {
    logger.custom('ws.csv', 'ws');

    // Обрабатываем событие подключения клиента
    wsServer.on('connection', (ws) => {
        logger.ws('Новое подключение');
        // Отправляем координаты каждые 1000 мс
        const intervalId = setInterval(() => {
            navigation.speed = gps.speed;
            navigation.course = gps.course;
            // Проверяем, что WebSocket всё ещё открыт перед отправкой сообщения
            if (ws.readyState === ws.OPEN) {
                const location = { latitude: 59.99596, longitude: 30 };
                sendLocation(ws, location);
            } else {
                // Очищаем интервал, если соединение закрыто
                clearInterval(intervalId);
                logger.ws(
                    'Соединение закрыто, отправка сообщений остановлена.'
                );
            }
        }, 1000);

        // Обрабатываем событие закрытия соединения
        ws.on('close', () => {
            logger.ws('Соединение закрыто');
            clearInterval(intervalId);
        });

        // Обрабатываем возможные ошибки
        ws.on('error', (error) => {
            logger.ws('Ошибка WebSocket:', error);
        });
    });
}

/**
 * Функция для отправки сообщения через WebSocket
 * @param {WebSocket} ws - серверный WebSocket
 * @param {Object} location - объект с координатами для отправки
 */
function sendLocation(ws, location) {
    ws.send(JSON.stringify(location), (error) => {
        if (error) {
            logger.ws('Ошибка отправки сообщения:', error);
        }
    });
}

export function moveCamera(id, pan, tilt) {
    navigation.cameras[id].moveToDirection(pan, tilt);
}

export function stopCamera(id) {
    navigation.cameras[id].stop();
}
