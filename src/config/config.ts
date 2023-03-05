import { env } from 'process'

export default {
	siteURL: env.SITE_URL,
	mongoURL: env.MONGO_URL,
	secret: env.JWT_SECRET,
	logs: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        maxsize: 100000000,
    },
	rateLimiter: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 30, // limit each IP to 30 requests per windowMs
    }
}
