import { ShipPositionCalculator } from './ship.js'; // поправил имя файла
import { join } from 'path';
import { Bearing } from './db.js';
const ship = new ShipPositionCalculator();

// Маршруты
export function setupRoutes(app) {
    // Отправка главной страницы
    app.get('/', (req, res) => {
        res.sendFile(join('index.html'));
    });

    app.get('/get-bearing', async (req, res) => {
        try {
            const ships = await Bearing.findAll();
            res.json(ships);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'An error occurred while fetching data',
            });
        }
    });

    // Добавить новую пеленгу
    app.post('/add-bearing', async (req, res) => {
        const { name, latitude, longitude, bearing } = req.body;

        // Проверяем, что все параметры переданы
        if (!latitude || !longitude || !bearing) {
            return res.status(400).json({ error: 'Недостаточно параметров' });
        }

        try {
            // Добавляем новую запись в таблицу Ship
            const newBearing = await Bearing.create({
                name,
                latitude,
                longitude,
                bearing,
            });

            res.json({ message: 'Пеленг добавлен', bearing: newBearing });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Ошибка при добавлении пеленга' });
        }
    });

    // Получить текущую позицию корабля
    app.get('/position', (req, res) => {
        try {
            const position = ship.calculatePosition();
            res.json(position);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}
