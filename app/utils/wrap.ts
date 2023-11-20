import _ from 'lodash'
import {NextFunction, Request, Response} from "express";


export class APIError extends Error {
    public constructor(
        public message: string,
        public description?: number | string,
        public status?: number,
    ) {
        super(message);
        if (typeof description === 'number') {
            this.status = description;
        } else {
            this.description = description;
            this.status = status || 500;
        }
        Error.captureStackTrace(this, APIError);
    }
}

export type TWrapController = (req: Request, res?: Response, next?: NextFunction) => object | string | Promise<null | undefined | string | object>

const applyMiddlewares = async (middlewares: TWrapController[], req: Request, res: Response) => {
    for (const middleware of middlewares) {
        if (res.headersSent) {
            return
        }
        await middleware(req, res)
    }
}

type TWrap = (...controllers: TWrapController[]) => (req: Request, res: Response, next?: NextFunction) => Promise<void | Response>

export const wrap: TWrap = (...controllers) =>
    async (req, res, next) => {
        const middlewares = _.initial(controllers)
        const controller = _.last(controllers)

        if (!controller) {
            return res.send('empty controller').status(500)
        }

        try {
            await applyMiddlewares(middlewares, req, res)
            const result = await controller(req, res, next)

            if (res.headersSent) {
                return
            }

            if (_.isUndefined(result) || _.isNull(result)) {
                return res.send().status(204)
            }

            if (typeof result === 'string') {
                return res.send(result).status(200)
            }

            return res.json(result).status(200)
        } catch (err) {
            if (err instanceof APIError) {
                return res.json({ message: err.message }).status(err.status || 500)
            } else {
                return res.send('Internal server error').status(500)
            }
        }
    }
