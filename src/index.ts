import { config } from './config/config';
import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import Logging from './library/Logging';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import routes from './routes/index';
import compression from 'compression';
import bodyParser from 'body-parser';

const router = express();

mongoose
    .connect(config.mongo.url, { retryWrites: true, w: 'majority' })
    .then(() => {
        Logging.info('mongo connected');
    })
    .catch((error) => {
        Logging.error('Unable to connect : ');
        Logging.error(error);
    });

/** Server */
const StartServer = () => {
    router.use((req, res, next) => {
        Logging.info(`Incoming -> Method: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);

        res.on('finish', () => {
            Logging.info(`Incoming -> Method: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - Status: [${res.statusCode}]`);
        });

        next();
    });

    router.use(cookieParser());
    router.use(cors());
    router.use(compression());
    router.use(bodyParser.json());

    /**Routes */
    router.use('/', routes());

    /** Health Check */
    router.get('/ping', (req, res, next) => res.status(200).json({ message: 'pong' }));

    /** Error handling */
    router.use((req, res, next) => {
        const error = new Error('route not-found');
        Logging.error(error);

        return res.status(404).json({ message: error.message });
    });

    http.createServer(router).listen(config.server.port, () => Logging.info(`Server is running on port ${config.server.port}`));
};

StartServer();
