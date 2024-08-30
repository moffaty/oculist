import express from 'express';
import http from 'http';
import { setupRoutes } from './routes.js';
import session from 'express-session';
import { PORT, sessionOpts } from './config.js';
import Logger from 'logger-files';

const logger = new Logger();

const app = express();

app.use(express.json());
app.use(session(sessionOpts));

setupRoutes(app);

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
