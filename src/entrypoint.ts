import logger from './logger'
import os from 'os'
import express from 'express'
import { AHCServer } from './server'

(async () => {
	const entrypoint = await AHCServer({ app: express() })
	const port = process.env.PORT || 8080

	/** check memory usage and do not run if less then 1 GB */
	const freeMemory = Math.round(os.freemem() / (1024 * 1024));
	if (freeMemory < 1024) {
		throw new Error(
			`Cannot run engine if available memory is less then 1024 MiB => Current free memory: ${freeMemory} MiB`
		);
	}

	entrypoint.listen(port, () => {
		logger.info(`🛡️  Server started on port: ${port}`)
		logger.info(`🖥️  Running in env: ${process.env.NODE_ENV}`)
		logger.info(`🖥️  Current server available memory: ${freeMemory} MiB`)
	})
	.on('error', (err) => {
		logger.error(err)
		process.exit(1)
	})
})()
