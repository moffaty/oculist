import express from 'express';
import http from 'http';
import { join } from 'path';
import { setupRoutes } from './server/routes.js';
import session from 'express-session';
import { setupWebSocket } from './server/socket.js';
import { PORT, sessionOpts } from './server/config.js';
import { dirname } from 'path';
import { logger } from './server/config.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());
app.use(session(sessionOpts));

setupRoutes(app);
setupWebSocket();

let server = http.createServer(app);

export async function startServer() {
    server.listen(PORT, () => {
        logger.server('http://localhost:' + server.address().port);
    });
}
export async function stopServer() {
    server.close();
}

startServer();
