import { AxiosResponse } from 'axios'
import { HttpStatus } from '../../enums'
import { HejtoException } from './base.exception'

export class UnauthorizedHejtoException extends HejtoException {
	constructor(message: string, hejtoResponse?: AxiosResponse) {
		super(HttpStatus.UNAUTHORIZED_401, message, hejtoResponse)
	}
}
