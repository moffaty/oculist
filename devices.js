import fs from 'fs';
import { runCommand } from './commands.js';

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

// rtsp://admin:password@192.168.1.68:554/
const rtspPort = 554;

async function checkCamera(data) {
    // Шаг 1: Проверка пинга до устройства
    await runCommand(
        'ping -n 3 ' + data.address + ' > nul',
        'Проверка подключения к камере...',
        '+Подключение обнаружено'
    );

    // Шаг 2: Проверка доступности RTSP потока
    const rtspUrl = `rtsp://admin:password@${data.address}:554/`; // Должен быть в конфиге
    console.log(rtspUrl);
    // await runCommand(`ffmpeg/bin/ffmpeg.exe -rtsp_transport tcp -i ${rtspUrl} -t 5 -vframes 1 output.jpg`, "Проверка RTSP потока...");
}

config.cameras.forEach(async (camera) => {
    await checkCamera(camera);
});
