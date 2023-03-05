import winston from 'winston'
import path from 'path'
import config from './config'

const { format, transports } = winston

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    http: 2,
    info: 3,
    debug: 4
  }
}

const date = new Date().toLocaleDateString('pl-PL');
const [combinedLogFileName, errorLogName] = [`combined_log_${date}.log`, `error_log_${date}.log`];

const logFormat = format.printf(
  (info) =>
      `[${info.timestamp}] :: [${info.level}] :: [${
          info.requestId || info.process || 'app'
      }] :: ${info.message}${
          Object.keys(info.metadata).length
              ? '\n' + JSON.stringify(info.metadata, null, 2)
              : ''
      }`
)

export default winston.createLogger({
  levels: customLevels.levels,
  format: format.combine(
    format(info => {
      info.level = info.level.toUpperCase()
      return info;
    })(),
    format.label({ label: path.basename(require.main.filename) }),
    format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    // Format the metadata object
    format.metadata({
      fillExcept: [
        'level',
        'timestamp',
        'label',
        'message',
        'requestId',
        'process']
      })
  ),
  transports: [
    new transports.Console({
      level: 'info',
      format: format.combine(
        format.colorize(),
        format.splat(),
        logFormat
      )
    }),
    new transports.File({
      level: 'warn',
      filename: `logs/${errorLogName}`,
      maxsize: config.logs.maxsize,
      format: format.combine(
        format.splat(),
        format.json()
      )
    }),
    new transports.File({
      level: 'debug',
      filename: `logs/${combinedLogFileName}`,
      maxsize: config.logs.maxsize,
      format: format.combine(
        format.splat(),
        format.json()
      )
    })
  ],
  exitOnError: false
}) as winston.Logger & Record<keyof typeof customLevels.levels, winston.LeveledLogMethod>
