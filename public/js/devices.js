const devicesButton = document.querySelector('.devices-button');

if (devicesButton) {
    devicesButton.addEventListener('click', async (e) => {
        const devicesInfo = await getDevicesInfo();
        console.log(devicesInfo);
    });

    async function getDevicesInfo() {
        const response = await fetch('/devices/info');
        const data = await response.json();
        return data;
    }
}
