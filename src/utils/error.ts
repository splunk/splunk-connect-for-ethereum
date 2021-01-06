export class RuntimeError extends Error {
    public readonly cause?: Error;
    constructor(msg: string, cause?: Error) {
        super(msg);
        this.name = this.constructor.name;
        this.message = msg;
        this.cause = cause;
        Error.captureStackTrace(this, this.constructor);
    }
}
