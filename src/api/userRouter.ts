import { Router } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config'
import {
	accessMiddlewareV2,
	flipPermission,
	getFlagPermissions
} from '../controllers/access'
import { logger } from '../logger'
import conversation from '../models/conversation'
import { default as user, default as userModel } from '../models/user'
import { RequestWithUser } from '../utils'
import { authentication } from './middleware/authentication'
import { makeAPIResponse } from './utils/response'

export const userRouter = Router()

userRouter.get('/me', authentication, (req: RequestWithUser, res) => {
	const permissions = getFlagPermissions(req.user.flags)
	return res.json(makeAPIResponse(res, { user: req.user, permissions }))
})

userRouter.get('/',
	authentication,
	accessMiddlewareV2('accessModsList'),
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
	accessMiddlewareV2('canChangeUserPermissions'),
	async (req, res) => {
		try {
			const target = await user.findOne({ _id: req.params.id }, { username: 1, flags: 1 })
			target.flags = flipPermission(target.flags, req.body.permission)
			await target.save()
			return res.json(makeAPIResponse(res, { patchObject: { permissions: getFlagPermissions(target.flags) } }))
		} catch (err) {
			logger.error('PUT - Set Permission Error', { errMsg: err?.message, stack: err.stack })
			return res.status(500)
				.send(makeAPIResponse(res, null, { message: 'Could not set permission' }))
		}
	}
)

userRouter.get('/conversations',
	authentication,
	accessMiddlewareV2('accessMessages'),
	async (req: RequestWithUser, res) => {
		try {
			const conversations = await conversation.find(
				{ 'userID': req.user._id }, { _id: 1 },
				{ sort: { 'messages.time': -1 }, limit: 50 },
			)

			return res.json(makeAPIResponse(res, conversations))
		} catch (err) {
			logger.error('GET - Conversation Error', { errMsg: err?.message, stack: err.stack })
			return res.status(500)
				.send(makeAPIResponse(res, null, { message: 'Cannot get conversations right now. Server error' }))
		}
	}
)

userRouter.post('/login', async (req, res) => {
	userModel.findOne({ username: req.body.username }).lean().then(user => {
		if (!user || user.password !== req.body.password) {
			logger.error('User or password does not match or exist', { username: user })
			return res.status(401)
						.json(makeAPIResponse(res, null, { message: 'Invalid login or password' }))
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

		return res.status(500)
				.send(makeAPIResponse(res, null, { message: 'Server Error. Login is not possible at the moment' }))
	})
})

userRouter.get('/logout', (req, res) => {
	res.clearCookie('token')
	return res.json(makeAPIResponse(res, {}))
})
