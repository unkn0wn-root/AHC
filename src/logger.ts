import winston from 'winston';
import { newline, ROOT_DIR } from './helpers'


const formatStack = (stack: string | undefined) => `${stack ? newline(stack) : ''}`
const formatErrMsg = (message: string | undefined) => `${message ? newline(message) : ''}`

const formatOptions = winston.format.combine(
	winston.format.timestamp({
		format: 'YYYY-MM-DD HH:mm:ss',
	}),
	winston.format.printf(
		({ level, timestamp, message, errMsg, stack, meta }) =>
			`[${level.toUpperCase()}] ${timestamp} ${message} ${formatErrMsg(errMsg)} ${formatStack(stack)} ${
				meta ? newline(JSON.stringify(meta)) : ''
			}`,
	),
	winston.format.colorize({
		all: true,
		level: true,
		message: true,
		colors: {
			error: 'red',
			warn: 'yellow',
			info: 'cyan',
			debug: 'white',
		},
	}),
)

export const logger = winston.createLogger({
	transports: [
	// In test env put logs into a file, otherwise the console
		...(process.env.NODE_ENV === 'development'
			? [new winston.transports.File({ filename: `${ROOT_DIR}/test-logs` })]
			: [new winston.transports.Console({ format: formatOptions })]),
	],
	exitOnError: false,
})
