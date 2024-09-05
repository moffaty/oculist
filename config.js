import Logger from 'logger-files';

export const logger = new Logger();

export const sessionOpts = {
    secret: '123',
    resave: false,
    isAuth: false,
    sameSite: 'none',
    name: 'Oculist',
    proxy: true,
    saveUninitialized: true,
    cookie: { secure: false },
};
export const PORT = 7777;
