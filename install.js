import { runCommand, runInBackground } from './commands.js';
import { platform } from 'os';

async function installPythonDependencies() {
    let pip = 'pip';
    if (platform() === 'linux') {
        pip = 'pip3';
    }
    return await runCommand(
        pip + ' install -r ./camera/requirements.txt --user',
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

        console.log('\nВсе команды успешно выполнены!');
    } catch (error) {
        console.error('\nПроизошла ошибка во время выполнения команд:', error);
    }
}

// Запуск всех команд
runAllCommands();
