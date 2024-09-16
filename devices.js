import fs from 'fs';
import { runCommand } from './commands.js';
import { RFinder, GPS } from './device.js';
import { logger } from './server/config.js';

logger.custom('DEVICES.CSV', 'devices');
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

function getFormattedDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const date = month + day + year;
    return date;
}

let cameraWork = true;
let rfindersWork = true;
let gpsWork = true;

async function checkCamera(data) {
    // Шаг 1: Проверка пинга до устройства
    const res = await runCommand(
        'ping -n 3 ' + data.address + ' > nul',
        'Проверка подключения к камере...',
        '+Подключение обнаружено',
        '-Не удалось подключиться к камерам. Проверьте сетевое подключение',
        logger.devices
    );
    if (res === false) {
        cameraWork = false;
    }
}

async function checkRfinder(data) {
    // Шаг 1: Проверка подключения по порту
    const rf = new RFinder(data);
    // Дождемся и убедимся, что устройство подключено
    await new Promise((resolve) => {
        setTimeout(() => {
            if (rf.device === null) {
                rfindersWork = false;
            }
            rf.stop();
            resolve();
        }, 1000); // Подождите 1 секунду, чтобы дать время устройству на инициализацию
    });
}

async function checkGPS(data) {
    const gps = new GPS(data);
    await new Promise((resolve) => {
        setTimeout(() => {
            if (gps.device === null) {
                gpsWork = false;
            }
            gps.stop();
            resolve();
        }, 1000); // Подождите 1 секунду, чтобы дать время устройству на инициализацию
    });
}

async function resultTest() {
    // Дожидаемся завершения проверки камер
    await Promise.all(config.cameras.map((camera) => checkCamera(camera)));

    // Дожидаемся завершения проверки дальномеров
    await Promise.all(config.rfinders.map((rfinder) => checkRfinder(rfinder)));

    // Дожидаемся завершения проверки GPS
    await checkGPS(config.GPS);

    if (rfindersWork && cameraWork && gpdWork) {
        logger.devices('Устройства подключены! Можно начинать работу');
    } else {
        logger.devices(
            `Одно или несколько устройств подключены не правильно. Проверьте логи - ./logs/${getFormattedDate()}/devices`
        );
    }
}

await resultTest();

logger.stop();
