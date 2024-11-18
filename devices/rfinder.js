import { Device } from './device.js';
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
