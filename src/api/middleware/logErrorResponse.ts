import { Request, Response, NextFunction } from 'express'
import logger from '../../logger'
import colorize from '../../helpers/colorize'
import { HttpError } from '../../exceptions/httpExceptions'

/**
 * Log Response
 */
const logErrorResponse = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
    const { requestId, method, url, ip } = req
    const { statusCode } = res
    const status = colorize(statusCode.toString(), undefined, statusCode)
    const colorizedMethod = colorize(method, undefined, undefined, method)

    logger.info(`${colorizedMethod} ${url} remote: ${ip} :: status: ${status} message: ${err.message}`, {requestId})
}

const logOriginError = (err: Error | HttpError, req: Request, res: Response, next: NextFunction) => {
    const { requestId } = req
    const innerError = err instanceof HttpError ? err.originalErrorMessage() : err.message

    logger.error(`${innerError ?? ''} \n${(err as Error).stack}`.trimStart(), {requestId})

    return next(err)
}

export { logErrorResponse, logOriginError }
