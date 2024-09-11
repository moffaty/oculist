import { OnvifDevice } from 'onvif-zeep';

const cameraConfig = {
    hostname: '192.168.1.68', // IP-адрес вашей камеры
    port: 8080, // Порт ONVIF, обычно 8080
    username: 'admin',
    password: 'password',
};

async function getCameraPosition() {
    try {
        const device = new OnvifDevice({
            hostname: cameraConfig.hostname,
            port: cameraConfig.port,
            username: cameraConfig.username,
            password: cameraConfig.password,
        });

        await device.init();

        // Получаем PTZ конфигурацию
        const ptz = device.ptz;
        const status = await ptz.getStatus();
        console.log('Текущий статус PTZ:', status);

        // Получаем информацию о движении и позиции
        const position = await ptz.getStatus();
        console.log('Текущее положение камеры:', position);
    } catch (error) {
        console.error('Ошибка при получении информации о камере:', error);
    }
}

getCameraPosition();
