import { StatusCode } from 'status-code-enum'
import { HttpError } from './baseHttpError'

export class ClientSyntaxError extends HttpError {
    constructor(message: string = 'Request was malformed or bad request', originError?: Error) {
        super(
            'SyntaxError',
            'Invalid Request',
            message,
            StatusCode.ClientErrorBadRequest,
            originError
        )
    }
}
