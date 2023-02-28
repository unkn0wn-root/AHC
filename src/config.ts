import { env } from 'process'

export default {
	siteURL: 'https://localhost:1337', //site url without / at end
	mongoURL: env.MONGO_URL,
	secret: env.JWT_SECRET, //AHC secret key,
}
