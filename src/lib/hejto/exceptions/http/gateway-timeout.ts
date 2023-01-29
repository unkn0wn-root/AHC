import { AxiosResponse } from 'axios'
import { HttpStatus } from '../../enums'
import { HejtoException } from './base.exception'

export class GatewayTimeoutHejtoException extends HejtoException {
	constructor(message: string, hejtoResponse?: AxiosResponse) {
		super(HttpStatus.GATEWAY_TIMEOUT_504, message, hejtoResponse)
	}
}
