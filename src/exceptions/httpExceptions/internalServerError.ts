import { StatusCode } from 'status-code-enum'
import { HttpError } from './baseHttpError'

export class InternalServerError extends HttpError {
    constructor(message: string = 'Unexpected server error', originError?: Error) {
        super(
            'InternalServerError',
            'Internal Server Error',
            message,
            StatusCode.ServerErrorInternal,
            originError
        )
    }
}
