import axios, { AxiosRequestConfig } from 'axios'
import logger from '../../../logger'
import { concatUrls } from '../utils'
import { HejtoResponse } from '../types/hejto-response.type'
import { IHejtoProvider } from '../interfaces/hejto-provider.interface'
import config from '../config'

type HejtoTokenResponse = {
    access_token: string;
    expires_in: number;
}

type HejtoTokenConfig = {
    client_id: string;
    client_secret: string;
    greant_type: string;
}

export class HejtoProvider extends IHejtoProvider {
	private BASE_URL: string
	private HEADERS: { [key: string]: any }
    private static token: HejtoTokenResponse | null = null

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
			const axiosInstance = axios.create({
				headers: { ...this.HEADERS }
			})

			const response = await axiosInstance.request<T>({
				url: this.format(url),
				params,
				...options,
			})

			return {
				data: response.data, status: response.status, headers: response.headers
			}
		} catch (e) {
            // 493 means token is probably expired, so get new token and set env to new token
            if (e.response?.status === 403) {
                const token = await this.refreshToken()
                process.env.HEJTO_API_KEY = token.access_token
            }
			const responseMsg = e.response?.data ?? e.response?.message

			logger.error('Request to Hejto API failed:', {
				err_response: responseMsg,
				stack: e.stack
			})

			throw this.determineException(
				e.response?.status ?? '', responseMsg, e.response
			)
		}
	}

    static async getToken(
        authUrl: string,
        tokenRequest: HejtoTokenConfig,
        headers?: { [key: string]: any }
    ): Promise<HejtoTokenResponse> {
        if (!HejtoProvider.token) {
            const axiosInstance = axios.create({
                headers: { ...headers },
            })

            const response = await axiosInstance.request<HejtoTokenResponse>({
                url: authUrl,
                method: 'POST',
                data: {
                    ...tokenRequest,
                },
            })

            const { access_token, expires_in } = response.data;
            HejtoProvider.token = {
                access_token,
                expires_in,
            }
        }

        return HejtoProvider.token
    }

	private format(url: string): string {
		return concatUrls(this.BASE_URL, url)
	}

    private refreshToken() {
        const { hejtoAuthData, hejtoAuthUrl } = config
        return HejtoProvider.getToken(hejtoAuthUrl, hejtoAuthData)
    }
}
