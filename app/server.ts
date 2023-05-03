import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { usersRouter } from './routers/usersRouter';
import { adminsRouter } from './routers/adminsRouter';
import { teamsRouter } from './routers/teamsRouter';
import { gamesRouter } from './routers/gamesRouter';
import { roundsRouter } from './routers/roundsRouter';
import { mainRouter } from './routers/mainRouter';
import cookieParser from 'cookie-parser';
import boolParser from 'express-query-boolean';
import path from 'path';
import { Server as WSServer } from 'ws';
import { HandlerWebsocket } from './socket';
import { AppDataSource } from './data-source';

export class Server {
    private app;

    constructor() {
        this.app = express();
        this.config();
        this.routerConfig();
        this.DBconnection().then(() => {
        });
    }

    private async DBconnection() {
        try {
            AppDataSource.initialize()
                .then(() => {
                    console.log('Connected to Postgres');
                });
        } catch (error) {
            console.error(error);
            console.log('Try again after 10 seconds');
            setTimeout(async () => {
                AppDataSource.initialize()
                    .then(() => {
                        console.log('Connected to Postgres');
                    }).catch(() => {
                    throw new Error('Unable to connect to db');
                });
            }, 10000);
        }
    }

    private config() {
        this.app.use(cors({ origin: '*' }));
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
        this.app.use('/api/rounds', roundsRouter());
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
                        console.log(error);
                    }
                });
            });
        });
    };
}

export default Server;