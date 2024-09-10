import { exec, spawn } from 'child_process';

// Функция для выполнения shell-команд
function runCommand(command, description) {
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
                console.log(`Результат: ${stdout}`);
                if (stderr) console.error(`Предупреждение: ${stderr}`);
                resolve();
            }
        });
    });
}

// Функция для выполнения команды в фоне
function runInBackground(command, description) {
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

async function installPythonDependencies() {
    return await runCommand(
        'pip install -r ./camera/requirements.txt --user',
        'Установка Python зависимостей'
    );
}

async function installNodeDependencies() {
    return await runCommand('npm i', 'Установка npm зависимостей');
}

async function createDatabase() {
    return await runCommand('node db.js --create', 'Создание базы данных');
}

async function updateGitHooks() {
    return await runCommand(
        'git config core.hooksPath ./githooks',
        'Обновление пути к гит-хукам'
    );
}

function startServer() {
    return runInBackground('node server', 'Запуск в режиме разработки');
}

// Функция для выполнения всех команд последовательно
async function runAllCommands() {
    try {
        // Установка зависимостей для Python
        await installPythonDependencies();
        // Установка npm зависимостей
        await installNodeDependencies();
        // Создание базы данных
        await createDatabase();

        await updateGitHooks();

        startServer();

        console.log(
            '\nВсе команды успешно выполнены!\nСервер: http://localhost:7777/'
        );
    } catch (error) {
        console.error('\nПроизошла ошибка во время выполнения команд:', error);
    }
}

// Запуск всех команд
runAllCommands();
