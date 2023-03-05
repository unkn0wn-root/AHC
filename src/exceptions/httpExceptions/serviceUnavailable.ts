import { StatusCode } from 'status-code-enum'
import { HttpError } from './baseHttpError'

export class ServiceUnavailableError extends HttpError {
    constructor(message: string, originError?: Error) {
        super(
            'ServiceUnavailable',
            'Service unavailable',
            message,
            StatusCode.ServerErrorServiceUnavailable,
            originError
        )
    }
}
