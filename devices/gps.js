import { Device } from './device.js';
export class GPS extends Device {
    constructor(config) {
        super(config);
        this.latitude = 0;
        this.longitude = 0;
        this.course = 0;
        this.speed = 0;
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
