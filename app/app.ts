import 'reflect-metadata';
import { Server } from './server';
import * as dotenv from 'dotenv';
import { AppConfig } from './utils/app-config';

dotenv.config({ override: true });
const port = parseInt(AppConfig.port || '3000');

const starter = new Server().start(port)
    .then(port => console.log(`Running on port ${port}`))
    .catch(error => console.log(error));

export default starter;