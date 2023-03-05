import { StatusCode } from 'status-code-enum'
import { HttpError } from './baseHttpError'

export class ConflictError extends HttpError {
    constructor(message: string = 'Requested resource is not in its expected state', originError?: Error) {
        super(
            'ConflictError',
            'Resurce Conflict',
            message,
            StatusCode.ClientErrorForbidden,
            originError
        )
    }
}
