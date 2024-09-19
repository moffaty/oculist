import { join } from 'path';
import { Bearing } from '../db.js';
import { gps, camera1, camera2 } from './devices.js';
import { moveCamera, navigation } from './socket.js';

export let start = false;
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
            navigation.addPoint({ latitude, longitude, bearing: 0 });

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

            navigation.delPoint(id);

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
            // navigation.points[0].bearing = navigation.course + navigation.cameras[0].getCurrentOrientation().x * 100;
            navigation.points[0].bearing = 140;
            // для получения градусного значения разворота необходимо домножить число на сто,
            // так как в PTZ исчесление идёт таким образом: 1 это 90, -1 это -90 градусов, а 0.5 это +-45 граудосв
            // navigation.points[1].bearing = navigation.course + navigation.cameras[1].getCurrentOrientation().x * 100;
            navigation.points[1].bearing = 200;
            console.log(navigation.points);
            const position = navigation.getPosition(
                navigation.points[0],
                navigation.points[1]
            );
            console.log(position);
            res.json({
                res: true,
                message: { latitude: position._lat, longitude: position._lon },
            });
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

    // app.get('/ride/start', async (req, res) => {
    //     try {
    //         navigator = new Navigator('test');
    //         start = true;
    //         res.json({ res: true, msg: 'Следование начато' });
    //     } catch (error) {
    //         res.json({ res: false, msg: 'Не удалось начать следование' });
    //     }
    // });

    // app.get('/ride/end', async (req, res) => {
    //     try {
    //         await navigator.endRide();
    //         start = false;
    //         res.json({ res: true, msg: 'Следование закончено' });
    //     } catch (error) {
    //         res.json({ res: false, msg: 'Не удалось закончить следование' });
    //     }
    // });

    app.get('/camera/:id/:pan/:tilt', async (req, res) => {
        try {
            const { id, pan, tilt } = req.params;
            moveCamera(id, pan, tilt);
            res.json({ res: true });
        } catch (error) {
            res.json({ res: false, msg: 'Не удалось повернуть камеры' });
        }
    });

    app.get('/camera/:id/stop', async (req, res) => {
        try {
            const { id } = req.params;
            stopCamera(id);
            res.json({ res: true });
        } catch (error) {
            res.json({ res: false, msg: 'Не удалось остановить камеру' });
        }
    });
}
