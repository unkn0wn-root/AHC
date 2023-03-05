import {
	Router,
	Request,
	Response,
	NextFunction
} from 'express'
import jwt from 'jsonwebtoken'
import config from '../config'
import {
	accessMiddleware,
	flipPermission,
	getFlagPermissions
} from '../controllers/access'
import logger from '../logger'
import conversation from '../models/conversation'
import { default as user, default as userModel } from '../models/user'
import { RequestWithUser } from '../utils'
import { authentication } from './middleware/authentication'
import { makeAPIResponse } from './utils/response'
import { UnauthorizedError, InternalServerError } from '../exceptions/httpExceptions'


export const userRouter = Router()

userRouter.get('/me', authentication, (req: RequestWithUser, res) => {
	const permissions = getFlagPermissions(req.user.flags)
	return res.json(makeAPIResponse(res, { user: req.user, permissions }))
})

userRouter.get('/',
	authentication,
	accessMiddleware('accessModsList'),
	(req, res) => {
		user.find({}, { username: 1, flags: 1 }).lean().then(userList => {
			const userPermissionList = userList.map((user: any) => {
				user.permissions = getFlagPermissions(user.flags)
				return user
			})
			return res.json(makeAPIResponse(res, userPermissionList))
		})
	}
)

userRouter.put('/:id/setPermission',
	authentication,
	accessMiddleware('canChangeUserPermissions'),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const target = await user.findOne({ _id: req.params.id }, { username: 1, flags: 1 })
			target.flags = flipPermission(target.flags, req.body.permission)
			await target.save()
			return res.json(makeAPIResponse(res, { patchObject: { permissions: getFlagPermissions(target.flags) } }))
		} catch (err) {
			return next(new InternalServerError('Could not set permission', err))
		}
	}
)

userRouter.get('/conversations',
	authentication,
	accessMiddleware('accessMessages'),
	async (req: RequestWithUser, res: Response, next: NextFunction) => {
		try {
			const conversations = await conversation.find(
				{ 'userID': req.user._id }, { _id: 1 },
				{ sort: { 'messages.time': -1 }, limit: 50 },
			)
			return res.json(makeAPIResponse(res, conversations))
		} catch (err) {
			return next(new InternalServerError('Cannot get conversations right now. Server error', err))
		}
	}
)

userRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = await userModel.findOne({ username: req.body.username }).lean()
		if (!user || user.password !== req.body.password) {
			logger.error(
				'Incorrect username or password or user does not exist', { username: req.body?.username || '' }
			)
			return next(new UnauthorizedError('Invalid login or password'))
		}

		if (user.password === req.body.password) {
			const { password, ...userWithoutPassword } = user

			const token = jwt.sign({
				...userWithoutPassword,
				exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
			}, config.secret)

			res.cookie('token', token, { httpOnly: true })

			return res.json(makeAPIResponse(res, {
				...userWithoutPassword,
				token,
				permissions: getFlagPermissions(userWithoutPassword.flags),
			}))
		}
	} catch (err) {
		return next(new InternalServerError('Server Error. Login is not possible at the moment', err))
	}
})

userRouter.get('/logout', (req, res) => {
	res.clearCookie('token')
	return res.json(makeAPIResponse(res, {}))
})
