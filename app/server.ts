import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { usersRouter } from './routers/users.router';
import { adminsRouter } from './routers/admins.router';
import { teamsRouter } from './routers/teams.router';
import { gamesRouter } from './routers/games.router';
import { mainRouter } from './routers/main.router';
import cookieParser from 'cookie-parser';
import boolParser from 'express-query-boolean';
import path from 'path';
import { Server as WSServer } from 'ws';
import { HandlerWebsocket } from './socket';
import { AppDataSource } from './utils/data-source';
import { errorHandler } from './utils/api-error';

export class Server {
    private app;

    constructor() {
        this.app = express();
        this.config();
        this.routerConfig();
        this.app.use(errorHandler);
        this.DBconnection().then(() => {
        });
    }

    private DBconnection() {
        return AppDataSource.initialize()
            .then(() => {
                console.log('Connected to Postgres');
            })
            .catch((error) => {
                console.error(error);
            });
    }

    private config() {
        this.app.use(cors({
            origin: [
                'http://localhost',
                'http://localhost:3000',
            ],
            credentials: true,
        }));
        this.app.use(bodyParser.json()); // 100kb default
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(boolParser());
        this.app.use(express.static(path.resolve('./build/frontend')));
    }

    private routerConfig() {
        this.app.use(cookieParser());
        this.app.use('/api/users', usersRouter());
        this.app.use('/api/admins', adminsRouter());
        this.app.use('/api/teams', teamsRouter());
        this.app.use('/api/games', gamesRouter());
        this.app.use('/', mainRouter());
    }

    public start = (port: number) => {
        return new Promise((resolve, reject) => {
            const server = this.app.listen(port, '0.0.0.0', () => {
                resolve(port);
            }).on('error', (err: Object) => reject(err));

            const wss = new WSServer({ server, path: '/api/ws' });
            wss.on('connection', (ws) => {
                ws.on('message', (message: string) => {
                    try {
                        HandlerWebsocket(ws, message);
                    } catch (error: any) {
                        ws.send(JSON.stringify({
                            'action': 'ERROR'
                        }));
                        console.error(error);
                    }
                });
            });
        });
    };
}

export default Server;
