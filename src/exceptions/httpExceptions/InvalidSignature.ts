import { StatusCode } from 'status-code-enum'
import { HttpError } from './baseHttpError'

export class JWTInvalidSignature extends HttpError {
    constructor(message: string = 'Invalid JSON Web Token Signature', originError?: Error) {
        super(
            'InvalidSignature',
            'Invalid JWT Signature',
            message,
            StatusCode.ClientErrorExpectationFailed,
            originError
        )
    }
}
