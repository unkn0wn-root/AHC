import { StatusCode } from 'status-code-enum'
import { HttpError } from './baseHttpError'

export class ForbiddenError extends HttpError {
    constructor(message: string = 'You\'re not allowed to access this resource', originError?: Error) {
        super(
            'ForbiddenError',
            'Access denied',
            message,
            StatusCode.ClientErrorForbidden,
            originError
        )
    }
}
