const alert = document.querySelector('.alert');
const rideButton = document.querySelector('.ride-button');

alert.style.display = 'none';
document.querySelector('.ride-button').addEventListener('click', async (e) => {
    alert.style.display = 'block';
    if (rideButton.textContent.includes('Завершить')) {
        rideButton.textContent = 'Начать следование';
        alert.textContent = 'Следование завершено';
        await endRide();
    } else {
        rideButton.textContent = 'Завершить следование';
        alert.textContent = 'Следование начато';
        console.log(await startRide());
    }
    setTimeout(() => {
        alert.classList.add('fade');
        setTimeout(() => {
            alert.style.display = 'none';
            alert.classList.remove('fade');
        }, 200);
    }, 1000);
});

async function startRide() {
    const response = await fetch('/ride/start');
    const data = await response.json();
    return data;
}

async function endRide() {
    const response = await fetch('/ride/end');
    const data = await response.json();
    return data;
}
