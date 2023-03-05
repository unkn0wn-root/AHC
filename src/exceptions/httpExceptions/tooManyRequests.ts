import { StatusCode } from 'status-code-enum'
import { HttpError } from './baseHttpError'

export class TooManyRequestsError extends HttpError {
    constructor(message: string, originError?: Error) {
        super(
            'TooManyRequests',
            'Too Many Requests',
            message,
            StatusCode.ClientErrorTooManyRequests,
            originError
        )
    }
}
