import { AxiosResponse } from 'axios'
import { HttpStatus } from '../../enums'
import { HejtoException } from './base.exception'

export class NotFoundHejtoException extends HejtoException {
	constructor(message: string, hejtoResponse?: AxiosResponse) {
		super(HttpStatus.NOT_FOUND_404, message, hejtoResponse)
	}
}
