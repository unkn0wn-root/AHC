import dotenv from 'dotenv'

dotenv.config()

export default {
	environment: process.env.NODE_ENV,
	port: process.env.PORT,
	hejtoApiUrl: 'https://api.hejto.pl',
	headers: {
		apiKey: process.env.HEJTO_API_KEY
	}
}
