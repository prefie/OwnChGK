import 'reflect-metadata';
import { Server } from './server';
import { AppConfig } from './utils/app-config';

const port = parseInt(AppConfig.port || '3000');

const starter = new Server().start(port)
    .then(port => console.log(`Running on port ${port}`))
    .catch(error => console.error(error));

export default starter;