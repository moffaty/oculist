import fs from 'fs';
import { GPS, RFinder } from '../device.js';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

export const gps = new GPS(config.GPS);
