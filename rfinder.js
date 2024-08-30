import { SerialPort, ReadlineParser } from 'serialport';

const portPath = 'COM3'; // Replace with your port
const baudRate = 115200; // Replace with your baud rate

let port;

function openPort() {
    port = new SerialPort({ path: portPath, baudRate: baudRate }, (err) => {
        if (err) {
            console.error('Error opening port:', err.message);
            setTimeout(openPort, 5000); // Retry after 5 seconds if there's an error
        } else {
            console.log('Port opened successfully');
        }
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.on('open', () => {
        console.log('Open Connection');
    });

    port.on('data', (data) => {
        console.log('on Data', data.toString());
    });

    port.on('error', (err) => {
        console.error('Serial port error:', err.message);
        port.close(() => {
            setTimeout(openPort, 5000); // Retry after 5 seconds if there's an error
        });
    });

    port.on('close', () => {
        console.log('Port closed. Reconnecting...');
        setTimeout(openPort, 5000); // Retry after 5 seconds if the port is closed
    });

    parser.on('data', (data) => {
        console.log('Received data:', data.toString());
        // Here you can process the NMEA data and send it to a web client via WebSocket or another protocol
    });
}

openPort();

// Keep the script running
process.stdin.resume();
