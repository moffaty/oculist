import { SerialPort } from 'serialport';

SerialPort.list()
    .then((ports) => {
        ports.forEach((port) => {
            console.log(
                `Port: ${port.path}, Manufacturer: ${port.manufacturer}`
            );
        });
    })
    .catch((err) => {
        console.error('Error listing ports', err);
    });
