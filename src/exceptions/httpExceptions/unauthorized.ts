import { StatusCode } from 'status-code-enum'
import { HttpError } from './baseHttpError'

export class UnauthorizedError extends HttpError {
    constructor(message: string, originError?: Error) {
        super(
            'UnauthorizedError',
            'Access denied',
            message,
            StatusCode.ClientErrorUnauthorized,
            originError
        )
    }
}
