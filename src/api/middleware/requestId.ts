import { Request, Response, NextFunction } from 'express'
import { v4 as uuid } from 'uuid'


export default function requestId(req: Request, res: Response, next: NextFunction): void {
    if (req.url.includes('test')) {
        req.requestId = `TEST-${uuid()}`
    } else {
        req.requestId = uuid()
    }

   return next()
}
