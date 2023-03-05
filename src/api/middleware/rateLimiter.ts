import { Request, Response, NextFunction } from 'express'
import config from '../../config'
import Logger from '../../logger'
import rateLimit from 'express-rate-limit'
import { TooManyRequestsError } from '../../exceptions/httpExceptions'

const checkRateLimit = rateLimit({
    windowMs: config.rateLimiter.windowMs,
    max: config.rateLimiter.max,
    headers: true,
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    handler: (req: Request, res: Response, next: NextFunction) => {
        Logger.error(`${req.ip} exceeded rate limit`)

        const tooManyRequestsError = new TooManyRequestsError('Too many requests. Please wait a while then try again')

        return next(tooManyRequestsError)
    }
})

export default checkRateLimit
