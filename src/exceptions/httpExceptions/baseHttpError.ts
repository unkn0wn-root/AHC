import { StatusCode } from 'status-code-enum'

export abstract class HttpError extends Error {
    protected _httpStatusCode: StatusCode
    protected _errorName: string
    protected _errorTitle: string
    protected _originalError: Error

    protected constructor(
        name: string,
        title: string,
        message: string,
        statusCode: StatusCode,
        originError?: Error) {
        super(message)
        this._httpStatusCode = statusCode
        this._errorTitle = title
        this._errorName = name
        this._originalError = originError
    }

    public get statusCode(): StatusCode {
        return this._httpStatusCode
    }

    public get name() {
        return this._errorName
    }

    public get title() {
        return this._errorTitle
    }

    public originalErrorMessage(): string {
        return this._originalError?.message || null
    }

    public set originError(error: Error) {
        this._originalError = error
    }
}
