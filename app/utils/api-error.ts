export class APIError extends Error {
    public constructor(
        public message: string,
        public status?: number,
    ) {
        super(message);
        this.status = status || 500;

        Error.captureStackTrace(this, APIError);
    }
}

export const errorHandler = (err, req, res, next) => {
    console.error(err?.stack);

    if (err instanceof APIError) {
        return res.status(err.status || 500).json({ message: err.message })
    } else {
        return res.status(500).json({ message: err.message })
    }
};


