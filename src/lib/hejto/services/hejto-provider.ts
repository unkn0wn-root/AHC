import axios, { AxiosRequestConfig } from 'axios'
import { logger } from '../../../logger'
import { concatUrls } from '../utils'
import { HejtoResponse } from '../types/hejto-response.type'
import { IHejtoProvider } from '../interfaces/hejto-provider.interface'
import config from '../config'

export class HejtoProvider extends IHejtoProvider {
	private BASE_URL: string
	private HEADERS: { [key: string]: any }

	constructor() {
		super()

		const { hejtoApiUrl, headers } = config

		this.BASE_URL = hejtoApiUrl
		this.HEADERS = headers
	}

	async send<T>(
		url: string,
		params?: { [key: string]: string },
		options?: Omit<AxiosRequestConfig<T>, 'url' | 'params'>,
	): Promise<HejtoResponse<T>> {
		try {
			console.log({headers: this.HEADERS, opt: options, url: this.format(url)})
			const response = await axios.request<T>({
				url: this.format(url),
				params,
				headers: this.HEADERS,
				...options,
			})

			return {
				data: response.data, status: response.status, headers: response.headers
			}
		} catch (e) {
			logger.error('Request to Hejto API failed:', { errMsg: e.message, stack: e.stack })

			throw this.determineException(e.response?.status ?? '', e.response?.statusText ?? '', e.response)
		}
	}

	private format(url: string): string {
		return concatUrls(this.BASE_URL, url)
	}
}
