import dotenv from 'dotenv'

dotenv.config()

export default {
	environment: process.env.NODE_ENV,
	port: process.env.PORT,
	hejtoApiUrl: 'https://api.hejto.pl',
    hejtoAuthUrl: 'https://auth.hejto.pl/token',
    hejtoAuthData: {
        client_id: process.env.HEJTO_CLIENT_ID,
        client_secret: process.env.HEJTO_CLIENT_SECRET,
        greant_type: process.env.HEJTO_GRANT_TYPE
    },
    headers: {
		Authorization: `Bearer ${process.env.HEJTO_API_KEY}`
	}
}
