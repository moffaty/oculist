import { exec, spawn } from 'child_process';

// Функция для выполнения shell-команд
export function runCommand(command, description, res = 'Результат:') {
    return new Promise((resolve, reject) => {
        console.log(`\nЗапуск: ${description}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(
                    `Ошибка при выполнении команды: ${command}`,
                    error
                );
                reject(error);
            } else {
                console.log(`${res} ${stdout}`);
                if (stderr) console.error(`Предупреждение: ${stderr}`);
                resolve();
            }
        });
    });
}

// Функция для выполнения команды в фоне
export function runInBackground(command, description) {
    console.log(`\nЗапуск в фоне: ${description}`);

    // Разделяем команду на программу и аргументы
    const [cmd, ...args] = command.split(' ');

    // Запуск процесса в фоне
    const child = spawn(cmd, args, {
        stdio: 'inherit', // Это позволяет перенаправлять вывод в консоль
        detached: true, // Это делает процесс независимым от основного процесса
    });

    child.unref(); // Отключение связи с главным процессом
}
