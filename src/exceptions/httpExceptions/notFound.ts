import { StatusCode } from 'status-code-enum'
import { HttpError } from './baseHttpError'

export class NotFoundError extends HttpError {
    constructor(message: string = 'Requested resource(s) was not found', originError?: Error) {
        super(
            'Resource(s) Not Found',
            'NotFoundError',
            message,
            StatusCode.ClientErrorNotFound,
            originError
        )
    }
}
