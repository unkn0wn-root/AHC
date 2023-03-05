import { Request, Response, NextFunction } from 'express'
import logger from '../../logger'
import colorize from '../../helpers/colorize'


export default function logRequest(req: Request, res: Response, next: NextFunction): void {
    const { ip, url, method, query, body, requestId } = req
    const { password, ...data } = body
    const colorizedMethod = colorize(method, undefined, undefined, method)

    logger.http(`${colorizedMethod} => ${url} remote: ${ip} `, {requestId, query, body: data})

    return next()
}
