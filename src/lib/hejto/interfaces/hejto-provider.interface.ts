import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { HttpStatus } from '../enums'
import { HejtoResponse } from '../types/hejto-response.type'
import {
	HejtoException,
	BadRequestHejtoException,
	ForbiddenException,
	NotFoundHejtoException,
	InternalErrorException,
	UnauthorizedHejtoException,
	GatewayTimeoutHejtoException,
} from '../exceptions/http'

export abstract class IHejtoProvider {
	protected determineException(status: HttpStatus, message: string, hejtoResponse?: AxiosResponse): HejtoException {
		switch (status) {
		case HttpStatus.BAD_REQUEST_400:
			return new BadRequestHejtoException(message, hejtoResponse)
		case HttpStatus.UNAUTHORIZED_401:
			return new UnauthorizedHejtoException(message, hejtoResponse)
		case HttpStatus.FORBIDDEN_403:
			return new ForbiddenException(message, hejtoResponse)
		case HttpStatus.NOT_FOUND_404:
			return new NotFoundHejtoException(message, hejtoResponse)
		case HttpStatus.TOO_MANY_REQUESTS_429:
			return new InternalErrorException(message, hejtoResponse)
		case HttpStatus.INTERNAL_SERVER_ERROR_500:
			return new InternalErrorException(message, hejtoResponse)
		case HttpStatus.GATEWAY_TIMEOUT_504:
			return new GatewayTimeoutHejtoException(message, hejtoResponse)
		default:
		// @ts-ignore
			return new InternalErrorException(message, hejtoResponse !== [undefined], hejtoResponse)
		}
	}

	abstract send<T>(
		url: string,
		params?: { [key: string]: string },
		options?: Omit<AxiosRequestConfig<T>, 'url' | 'params'>,
		formatUrl?: (baseUrl: string, url: string) => string,
	): Promise<HejtoResponse<T>>
}
