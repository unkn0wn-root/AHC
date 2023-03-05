import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'
import config from '../../config'
import { RequestWithUser } from 'src/utils'
import { UnauthorizedError } from '../../exceptions/httpExceptions'

export function authentication(req: Request, res: Response, next: NextFunction) {
	let decoded
	const token = req.cookies.token

	try {
		decoded = jwt.verify(token, config.secret)
	} catch (error) {
		return next(new UnauthorizedError('Unauthorized'))
	}

	(req as RequestWithUser).user = decoded

	return next()
}
