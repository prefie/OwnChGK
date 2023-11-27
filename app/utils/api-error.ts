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

export const errorHandler = (err, req, res, next) => {
    console.error(err?.stack);

    if (err instanceof APIError) {
        return res.json({ message: err.message }).status(err.status || 500)
    } else {
        return res.send(err.message).status(500)
    }
};


