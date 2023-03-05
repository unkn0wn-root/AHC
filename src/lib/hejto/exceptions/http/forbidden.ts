import { AxiosResponse } from 'axios'
import { HttpStatus } from '../../enums'
import { HejtoException } from './base.exception'

export class ForbiddenException extends HejtoException {
	constructor(message: string, hejtoResponse?: AxiosResponse) {
		super(HttpStatus.FORBIDDEN_403, message, hejtoResponse)
	}
}
