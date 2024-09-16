import fs from 'fs';
import { logger } from './server/config.js';
import { SerialPort } from 'serialport';
const rfinderConfig = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

class Device {
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

export class GPS extends Device {
    constructor(config) {
        super(config);
        this.latitude = null;
        this.longitude = null;
        this.course = null;
        this.speed = null;
    }

    listenForResponse() {
        this.device.on('data', (data) => {
            const str = data.toString(this.encoding);
            this.buffer += str;

            // Разделяем данные на сообщения по символу `$`
            let index;
            while ((index = this.buffer.indexOf('$')) !== -1) {
                const endIndex = this.buffer.indexOf('\n', index);
                if (endIndex !== -1) {
                    // Извлекаем сообщение
                    const message = this.buffer.slice(index, endIndex).trim();
                    this.buffer = this.buffer.slice(endIndex + 1);

                    // Обрабатываем сообщение
                    if (message.startsWith('$')) {
                        this.parseNMEASentence(message);
                    }
                } else {
                    // Если конец строки не найден, ждем следующего фрагмента данных
                    break;
                }
            }
        });
    }

    parseNMEASentence(sentence) {
        const parts = sentence.split(',');

        switch (parts[0]) {
            case '$GPGGA':
                this.parseGPGGA(parts);
                break;
            case '$GPRMC':
                this.parseGPRMC(parts);
                break;
            case '$GPVTG':
                this.parseGPVTG(parts);
                break;
        }
    }

    parseGPGGA(parts) {
        // GPGGA format: $GPGGA,UTC,Lat,LatDir,Long,LongDir,FixQuality,NumSatellites,HDOP,Altitude,AltitudeUnit,HeightOfGeoid,GeoidUnit,DiffAge,DiffStationID*checksum
        this.latitude = this.convertToDecimal(parts[2], parts[3]);
        this.longitude = this.convertToDecimal(parts[4], parts[5]);
        // Other fields can be processed if needed
    }

    parseGPRMC(parts) {
        // GPRMC format: $GPRMC,UTC,A,Lat,LatDir,Long,LongDir,Speed,Course,Date,MagneticVariation,MagneticVarDir*checksum
        this.speed = parseFloat(parts[7]); // Speed in knots
        this.course = parseFloat(parts[8]); // Course in degrees
    }

    parseGPVTG(parts) {
        // GPVTG format: $GPVTG,CourseTrue,CourseMagnetic,SpeedKnot,SpeedKmph
        this.course = parseFloat(parts[1]); // Course in degrees
        this.speed = parseFloat(parts[5]); // Speed in knots
    }

    convertToDecimal(coord, dir) {
        if (!coord || !dir) return null;

        const degrees = parseFloat(coord.substring(0, 2));
        const minutes = parseFloat(coord.substring(2));
        const decimal = degrees + minutes / 60;

        return dir === 'S' || dir === 'W' ? -decimal : decimal;
    }
}

export class RFinder extends Device {
    constructor(config) {
        super(config);
        this.loggerMethod = `RF_${this.name}`;
        this.loggerFile = `rfinder${this.name}`;
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
}

// const gps = new GPS(rfinderConfig.GPS);
// setInterval(() => {
//     console.log(gps.speed, gps.latitude, gps.longitude);
// }, 4000);
// const rf = new RFinder(rfinderConfig.rfinders[0]);
// to work with rfinder need start with openport:
// const rf = new rfinder(configFile);
// rf.openPort(); // open serial port for commands and listening
