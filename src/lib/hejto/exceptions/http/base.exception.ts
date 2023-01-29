import { AxiosResponse } from 'axios'
import { HttpStatus } from '../../enums'

export abstract class HejtoException extends Error {
	protected _status: HttpStatus
	protected _message: string

	public hejtoResponse?: AxiosResponse

	protected constructor(status: HttpStatus, message: string, hejtoResponse?: AxiosResponse) {
		super()

		this._status = status
		this._message = message
		this.hejtoResponse = hejtoResponse
	}

	getStatus(): HttpStatus {
		return this._status
	}

	getLoggerFormat(): string {
		return `[${this._status}] - ${this._message}`
	}
}
