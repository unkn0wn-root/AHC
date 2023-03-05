/* eslint-disable class-methods-use-this */
import { noOpFn } from '../utils'

interface IApiError {
	message: string
}
export class ApiError extends Error {
	constructor(errorObject: IApiError, status: number) {
		super(`[${status}] ${errorObject.message}` || 'Unknow error')
	}
}

type APIErrorInterceptorFn = (err: ApiError) => ApiError

export class HttpClient {
	private errInterceptors: APIErrorInterceptorFn[]

	constructor(errInterceptors: APIErrorInterceptorFn[] = []) {
		this.errInterceptors = errInterceptors
	}

	private request(endpoint: string, method: string, body?: object) {
		return fetch(`/api/${endpoint}`, {
			method,
			body: JSON.stringify(body),
			headers: { 'Content-Type': 'application/json' },
		})
		.then(async (res) => {
			let responseData

			try {
				responseData = await res.json()
			} catch {
				throw new ApiError({ message: 'API malformed response' }, res.status)
			}

			if (responseData.status >= 400)
				throw new ApiError(responseData, responseData.status)

			return responseData.data
		})
		.catch((err) => {
			throw this.errInterceptors
				.reduce((errorObject, currentInterceptor) => currentInterceptor(errorObject), err)
		})
	}

	public GET(endpoint: string) {
		return this.request(endpoint, 'GET');
	}

	public POST(endpoint: string, body: object) {
		return this.request(endpoint, 'POST', body)
	}

	public PUT(endpoint: string, body: object) {
		return this.request(endpoint, 'PUT', body)
	}

	public DELETE(endpoint: string) {
		return this.request(endpoint, 'DELETE')
	}

	public SWALLOW(promise: Promise<any>) {
		return new Promise<any>((resolve) => promise.then(resolve).catch(noOpFn))
	}
}
