import { AxiosResponse } from 'axios'
import { HttpStatus } from '../../enums'
import { HejtoException } from './base.exception'

export class InternalErrorException extends HejtoException {
	constructor(message: string, hejtoResponse?: AxiosResponse) {
		super(HttpStatus.INTERNAL_SERVER_ERROR_500, message, hejtoResponse)
	}
}
