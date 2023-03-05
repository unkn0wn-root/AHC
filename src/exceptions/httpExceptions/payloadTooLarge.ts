import { StatusCode } from 'status-code-enum'
import { HttpError } from './baseHttpError'

export class PayloadTooLarge extends HttpError {
    constructor(message: string, originError?: Error) {
        super(
            'PayloadTooLarge',
            'Request too large',
            message,
            StatusCode.ClientErrorPayloadTooLarge,
            originError
        )
    }
}
