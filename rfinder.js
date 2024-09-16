import fs from 'fs';
import { logger } from './server/config.js';
import { SerialPort } from 'serialport';
const rfinderConfig = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

export class RFinder {
    constructor(config) {
        this.name = config.name;
        this.encoding = 'ascii';
        this.config = config;
        this.device = null;
        this.loggerMethod = `RF${this.name}`;
        this.loggerFile = `rfinder${this.name}`;
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
            if (availablePorts.includes(this.config.port)) {
                this.device = new SerialPort(
                    this.config.port,
                    this.config.options
                );
                this.device.on('open', () => this.#onOpen());
                this.device.on('error', (err) => this.#onError(err));
                this.device.on('close', () => this.#onClose());
                this.openPort(); // Попытка открыть порт
            } else {
                this.log(
                    `Дальномер ${this.name} не доступен (${this.config.port}).`
                );
                this.#attemptReconnect(); // Попытка переподключения через некоторое время
            }
        } catch (err) {
            this.log('Ошибка в отображении списка устройств: ', err.message);
            this.#attemptReconnect(); // Попытка переподключения через некоторое время
        }
    }

    #onOpen() {
        this.log('Порт успешно открыт');
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
                    this.log('Error closing port: ', err.message);
                }
            });
        } else {
            this.log('Port is already closed');
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
                    return this.log('Error on write: ', err.message);
                }
                this.log(`Command ${command} sent`);
            });
        } else {
            this.log('Port is not open');
        }
    }

    sendSingleRanging() {
        this.sendCommand('<MAonce>');
    }

    sendContinuousRanging() {
        this.sendCommand('<MAcont>');
    }

    sendStopRanging() {
        this.sendCommand('<MAStop>');
    }

    sendSpeedMeasurement() {
        this.sendCommand('<MAspeed>');
    }

    listenForResponse() {
        this.device.on('data', (data) => {
            this.log('Data received: ', data.toString(this.encoding).trim());
        });
    }
}

// const rf = new RFinder(rfinderConfig.rfinders[0]);
// to work with rfinder need start with openport:
// const rf = new rfinder(configFile);
// rf.openPort(); // open serial port for commands and listening
