import { exec, spawn } from 'child_process';

export function runPython(command) {
    return new Promise((resolve, reject) => {
        exec(`python ${command}`, (error, stdout, stderr) => {
            if (error) {
                reject(error); // если есть ошибка, вызываем reject
            } else {
                resolve(stdout); // в случае успеха возвращаем результат
            }
        });
    });
}

// Функция для выполнения shell-команд
export function runCommand(
    command,
    description,
    res = 'Результат:',
    err = `Ошибка при выполнении команды: ${command}`,
    log = console.log
) {
    return new Promise((resolve, reject) => {
        log(`Запуск: ${description}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                log(err);
                resolve(false);
            } else {
                log(`${res} ${stdout}`);
                if (stderr) console.error(`Предупреждение: ${stderr}`);
                resolve(true);
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
