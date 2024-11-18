import { exec } from 'child_process';
import fs from 'fs';
export class PtzControlInterface {
    constructor(ip) {
        this.ip = ip;
        this.x = 0.0;
        this.y = 0.0;
        this.z = 0.0;
        this.scriptPath = './ptz_control.py'; // путь к Python-скрипту
        fs.watchFile('./camera.json', { interval: 1000 }, (curr, prev) => {
            const data = JSON.parse(fs.readFileSync('./camera.json', 'utf-8'));
            this.x += data.pan;
            this.y += data.tilt;
        });
    }

    // Функция для вызова Python-скрипта с передачей параметров
    runCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const fullCommand = `python ${this.scriptPath} ${this.ip} ${command} ${args.join(' ')}`;
            exec(fullCommand, { encoding: 'utf8' }, (error, stdout, stderr) => {
                if (error) {
                    console.error(
                        `Ошибка при выполнении команды: ${error.message}`
                    );
                    reject(stderr);
                }
                console.log(`Результат команды: ${stdout}`);
                resolve(stdout);
            });
        });
    }

    stop() {
        return this.runCommand('stop');
    }

    // Инициализация камеры
    initCamera(ip) {
        return this.runCommand('init', [ip]);
    }

    // Возврат камеры на исходную позицию
    moveToOrigin(out = true) {
        if (out) {
            this.x = 0.0;
        } else {
            this.x = -1.0;
        }
        this.y = 1.0;
        this.z = 1.0;
        return this.runCommand('move_to_origin', [out ? 'true' : 'false']);
    }

    // Перемещение камеры в указанное направление
    moveToDirection(panAngle, tiltAngle) {
        this.x = panAngle;
        this.y = tiltAngle;
        return this.runCommand('move_to_direction', [panAngle, tiltAngle]);
    }

    // Перемещение камеры в абсолютное положение
    moveAbsolute(pan, tilt, velocity) {
        return this.runCommand('move_abspantilt', [pan, tilt, velocity]);
    }

    // Перемещение камеры относительно текущего положения
    moveRelative(pan, tilt, velocity) {
        return this.runCommand('move_relative', [pan, tilt, velocity]);
    }

    // Получение текущей ориентации камеры
    getCurrentOrientation() {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
        };
    }

    // Остановка камеры
    stop() {
        return this.runCommand('stop');
    }
}
