import { logger } from '../server/config.js';
import { SerialPort } from 'serialport';

export class Device {
    constructor(config) {
        this.name = config.name;
        this.encoding = 'ascii';
        this.config = config;
        this.device = null;
        this.loggerMethod = `DVC_${this.name}`;
        this.loggerFile = `device_${this.name}`;
        this.reloadTime = 5000;
        this.reloadTimeout = null;
        this.isStop = false;
        this.#bindLogger();
        this.#discoverPorts();
    }

    #bindLogger() {
        logger.custom(this.loggerFile, this.loggerMethod);
        if (typeof logger[this.loggerMethod] === 'function') {
            this.log = logger[this.loggerMethod];
        } else {
            this.log = console.log;
            logger.error('Не удалось привязать дальномер к логгеру');
        }
    }

    #attemptReconnect() {
        // Повторное обнаружение портов через 5 секунд
        if (!this.isStop) {
            this.reloadTimeout = setTimeout(() => {
                this.#discoverPorts();
            }, this.reloadTime);
        }
    }

    async #discoverPorts() {
        try {
            const ports = await SerialPort.list();
            const availablePorts = ports.map((port) => port.path);

            // Проверяем, доступен ли нужный порт
            if (availablePorts.includes(this.config.path)) {
                this.device = new SerialPort(this.config);
                this.device.on('open', () => this.#onOpen());
                this.device.on('error', (err) => this.#onError(err));
                this.device.on('close', () => this.#onClose());
                this.openPort(); // Попытка открыть порт
            } else {
                this.log(
                    `Устройство ${this.name} не доступен (${this.config.path}).`
                );
                this.#attemptReconnect(); // Попытка переподключения через некоторое время
            }
        } catch (err) {
            this.log('Ошибка в отображении списка устройств: ', err.message);
            this.#attemptReconnect(); // Попытка переподключения через некоторое время
        }
    }

    #onOpen() {
        this.log(`Порт успешно открыт (${this.config.path})`);
        this.listenForResponse();
    }

    #onError(err) {
        this.log('Ошибка: ', err.message);
        this.device.close(); // Попытка закрыть порт при ошибке
    }

    #onClose() {
        this.log('Порт закрыт');
    }

    openPort() {
        this.device.open((err) => {
            if (err) {
                this.log('Ошибка при открытие порта: ', err.message);
            }
        });
    }

    closePort() {
        if (this.device.isOpen) {
            this.device.close((err) => {
                if (err) {
                    this.log('Ошибка при закрытии порта: ', err.message);
                }
            });
        } else {
            this.log('Порт уже закрыт');
        }
    }

    stop() {
        this.isStop = true;
        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
            this.reloadTimeout = null; // Очистка ссылки на таймер
        }
        if (this.device !== null) {
            this.closePort();
        }
    }

    sendCommand(command) {
        if (this.device.isOpen) {
            this.device.write(command, (err) => {
                if (err) {
                    return this.log(
                        'Ошибка при отправке комманды: ',
                        err.message
                    );
                }
                this.log(`Комманда ${command} отправлена`);
            });
        } else {
            this.log('Порт не открыт');
        }
    }

    listenForResponse() {
        this.device.on('data', (data) => {
            this.log(
                'Полученные данные: ',
                data.toString(this.encoding).trim()
            );
        });
    }
}
