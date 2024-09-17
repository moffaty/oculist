import fs from 'fs';
import { GPS, RFinder, PtzControlInterface } from '../device.js';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

export const gps = new GPS(config.GPS);
export const camera1 = new PtzControlInterface(config.cameras[0].address);
export const camera2 = new PtzControlInterface(config.cameras[1].address);
