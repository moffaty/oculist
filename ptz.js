import { OnvifCamera } from 'onvif';

const IP = '192.168.1.68'; // Camera IP address
const PORT = 80; // Port
const USER = 'admin'; // Username
const PASS = 'aa123456'; // Password

class PTZControl {
    constructor() {
        this.camera = new OnvifCamera({
            xaddr: `http://${IP}:${PORT}/onvif/device_service`,
            user: USER,
            pass: PASS,
        });

        this.camera
            .init()
            .then(() => {
                console.log('Camera initialized');
                return this.camera.getService('ptz');
            })
            .then((ptzService) => {
                this.ptz = ptzService;
                return this.camera.getProfile();
            })
            .then((profile) => {
                this.profile = profile;
            })
            .catch((err) => {
                console.error('Error initializing camera:', err);
            });
    }

    async moveToDirection(panAngle, tiltAngle) {
        try {
            if (!this.ptz || !this.profile)
                throw new Error('PTZ or Profile not initialized.');

            const request = {
                ProfileToken: this.profile.token,
                Position: {
                    PanTilt: {
                        x: panAngle,
                        y: tiltAngle,
                    },
                    Zoom: {
                        x: 0.0,
                    },
                },
                Speed: {
                    PanTilt: {
                        x: 1.0, // Adjust speed as needed
                        y: 1.0,
                    },
                    Zoom: {
                        x: 1.0,
                    },
                },
            };

            await this.ptz.absoluteMove(request);
            console.log(
                `Moved to pan angle ${panAngle} and tilt angle ${tiltAngle}`
            );
        } catch (err) {
            console.error('Error moving camera:', err);
        }
    }

    async moveToOrigin() {
        try {
            if (!this.ptz || !this.profile)
                throw new Error('PTZ or Profile not initialized.');

            const request = {
                ProfileToken: this.profile.token,
                Position: {
                    PanTilt: {
                        x: 0.0,
                        y: 1.0,
                    },
                    Zoom: {
                        x: 0.0,
                    },
                },
                Speed: {
                    PanTilt: {
                        x: 1.0, // Adjust speed as needed
                        y: 1.0,
                    },
                    Zoom: {
                        x: 1.0,
                    },
                },
            };

            await this.ptz.absoluteMove(request);
            console.log('Moved to origin.');
        } catch (err) {
            console.error('Error moving camera to origin:', err);
        }
    }

    async getCurrentOrientation() {
        try {
            if (!this.ptz || !this.profile)
                throw new Error('PTZ or Profile not initialized.');

            const status = await this.ptz.getStatus({
                ProfileToken: this.profile.token,
            });
            const pan = status.Position.PanTilt.x;
            const tilt = status.Position.PanTilt.y;
            return { pan, tilt };
        } catch (err) {
            console.error('Error getting current orientation:', err);
        }
    }
}

// Example usage
const ptzControl = new PTZControl();

ptzControl.moveToDirection(-0.05, 0.3).then(() => {
    ptzControl.moveToOrigin().then(() => {
        ptzControl.getCurrentOrientation().then(({ pan, tilt }) => {
            console.log(`Current orientation - Pan: ${pan}, Tilt: ${tilt}`);
        });
    });
});
