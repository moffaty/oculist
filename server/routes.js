import { ShipPositionCalculator } from '../navigation/ship.js'; // поправил имя файла
import { join } from 'path';
import { Bearing } from '../db.js';
const ship = new ShipPositionCalculator();

// Маршруты
export function setupRoutes(app) {
    // Отправка главной страницы
    app.get('/', (req, res) => {
        res.sendFile(join('index.html'));
    });

    app.get('/get-bearing', async (req, res) => {
        try {
            const bearings = await Bearing.findAll();
            res.json(bearings);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'An error occurred while fetching data',
            });
        }
    });

    // Добавить новую пеленгу
    app.post('/add-bearing', async (req, res) => {
        const { name, latitude, longitude } = req.body;

        // Проверяем, что все параметры переданы
        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Недостаточно параметров' });
        }

        try {
            // Добавляем новую запись в таблицу Ship
            const newBearing = await Bearing.create({
                name,
                latitude,
                longitude,
            });

            res.json({ message: 'Пеленг добавлен', bearing: newBearing });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Ошибка при добавлении пеленга' });
        }
    });

    app.delete('/delete-bearing/:id', async (req, res) => {
        const id = req.params.id;
        try {
            const result = await Bearing.destroy({
                where: {
                    id: id,
                },
            });

            if (result === 1) {
                res.json(`Запись с ID ${id} успешно удалена.`);
            } else {
                res.status(400).json(`Запись с ID ${id} не найдена.`);
            }
        } catch (error) {
            res.status(500).json('Ошибка при удалении записи:', error);
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
