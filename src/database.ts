import mongoose from 'mongoose'
import config from './config'
import { logger } from './logger'

mongoose.connect(config.mongoURL,
	{},
	(err) => {
		if (err) {
			logger.error('Database Connection Error: ', { msg: err?.message, stack: err?.stack })
			process.exit(1)
		}
	}
)
