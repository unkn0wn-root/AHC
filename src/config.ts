import { env } from 'process'

export default {
	siteURL: 'https://localhost:1337', //site url without / at end
	mongoURL: env.MONGO_URL,
	secret: env.SITE_SECRET, //website's secret key,
}
