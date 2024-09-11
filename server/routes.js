import { join } from 'path';
import { Bearing } from '../db.js';
import { Navigator } from '../navigation/navigator.js';

let navigator;

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
            // const position = ship.calculatePosition();
            res.json(0);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/devices/:type', (req, res) => {
        const type = req.params.type;
        console.log(type);
        switch (type) {
            case 'info': {
                res.json({ test: 'lol' });
            }
        }
    });

    app.get('/ride/start', async (req, res) => {
        try {
            navigator = new Navigator('test');
            res.json({ res: true, msg: 'Следование начато' });
        } catch (error) {
            res.json({ res: false, msg: 'Не удалось начать следование' });
        }
    });

    app.get('/ride/end', async (req, res) => {
        try {
            await navigator.endRide();
            res.json({ res: true, msg: 'Следование закончено' });
        } catch (error) {
            res.json({ res: false, msg: 'Не удалось закончить следование' });
        }
    });
}
