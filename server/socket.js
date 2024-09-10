import { WebSocketServer } from 'ws';
import { logger } from './config.js';
import { calculateDestination } from '../navigation/destination.js';
export function setupWebSocket() {
    const ws = new WebSocketServer({ port: 9999 });
    logger.custom('ws.csv', 'ws');
    ws.on('connection', (ws) => {
        setInterval(() => {
            // начальные координаты
            const startPostion = { latitude: 59.99596, longitude: 30 };
            ws.send(JSON.stringify({ latitude: 59.99596, longitude: 30 }));
            // нужно отправить вычесленную позицию
        }, 1000);
    });
}
