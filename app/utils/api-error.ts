const BAD_REQUEST_STATUS = 500;

export class APIError extends Error {
    public constructor(
        public message: string,
        public status?: number,
    ) {
        super(message);
        this.status = status || BAD_REQUEST_STATUS;

        Error.captureStackTrace(this, APIError);
    }
}

export const errorHandler = (err, req, res, _) => {
    if (err instanceof APIError && err?.status) {
        return res.status(err.status).json({message: err.message});
    } else {
        console.error(err?.stack);

        return res.status(BAD_REQUEST_STATUS).json({message: err?.message});
    }
};
