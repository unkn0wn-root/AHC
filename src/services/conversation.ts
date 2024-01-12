import {
	Router,
	Response,
	NextFunction
} from 'express'
import { RequestWithUser } from '../utils'
import logger from '../logger'
import confessionModel from '../models/confession'
import userModel from '../models/user'
import * as conversationController from '../controllers/conversations'
import auth from '../controllers/authorization'
import { csrfErrorHander, csrfProtection } from '../csrf'
import {
	InternalServerError,
	NotFoundError,
	ClientSyntaxError
} from '../exceptions/httpExceptions'

const conversationRouter = Router()

function renderConversationRoute(req, res, params) {
	return res.render('conversation', {
		csrfToken: (req as any).csrfToken(),
		...params,
	})
}

conversationRouter.use(auth(false))
conversationRouter.get(
	'/:parent/new',
	csrfProtection,
	async (req: RequestWithUser, res: Response, next: NextFunction) => {
	try {
		if (req.params.parent.substr(0, 2) === 'U_') {
			const username = req.params.parent.substr(2)
			const userObject = await userModel.findOne({ username: username }, { _id: 1, username: 1 })
            if (!userObject) return next(new NotFoundError())

            return renderConversationRoute(req, res, { type: 'user', userObject })
		}

		confessionModel.findById(req.params.parent, (err, confession) => {
			if (err) throw err
			if (!confession) return next(new NotFoundError())
			return renderConversationRoute(req, res, { type: 'confession', confession })
		})
	} catch (err) {
		return next(new InternalServerError(undefined, err))
	}
})

function createConversationMiddleware(req: RequestWithUser, res: Response, next: NextFunction) {
	conversationController.createNewConversation(res.locals.conversationParent, (err, conversationid) => {
		if (err) return next(new InternalServerError(undefined, err))

		conversationController.newMessage(conversationid, null, req.body.text, req.ip, (err) => {
			if (err) return next(new InternalServerError(undefined, err))
			return res.redirect(`/conversation/${conversationid}`)
		})
	})
}

conversationRouter.post(
	'/:parent/new',
	csrfErrorHander,
	async (req: RequestWithUser, res: Response, next: NextFunction) => {
	if (!req.body.text) return next(new ClientSyntaxError('Missing text field'))
	try {
		if (req.params.parent.substr(0, 2) === 'U_') {
			const username = req.params.parent.substr(2)
			const userObject = await userModel.findOne({ username: username }, { _id: 1, username: 1 })
            if (!userObject) return next(new NotFoundError())

            res.locals.conversationParent = userObject
			return next()
		}

		confessionModel.findById(req.params.parent, (err, confession) => {
			if (err) throw err
			if (!confession) return next(new NotFoundError())
			res.locals.conversationParent = confession
			return next()
		})
	} catch (err) {
		return next(new InternalServerError('Conversation could not be saved right now', err))
	}
}, createConversationMiddleware)

conversationRouter.get(
	'/:conversationid/:auth?',
	csrfProtection,
	(req: RequestWithUser, res: Response, next: NextFunction) => {
	if (!req.params.conversationid) return next(new ClientSyntaxError('Missing conversationid'))
	if (!req.params.auth && req.user !== undefined && req.user._id) req.params.auth = req.user._id.toString()

	conversationController.getConversation(req.params.conversationid, req.params.auth, (err, conversation) => {
		if (err)
            return next(new InternalServerError('Conversation could not be loaded right now', err))

        return renderConversationRoute(req, res, { conversation })
	})
})

conversationRouter.post(
	'/:conversationid/:auth?',
	csrfErrorHander,
	(req: RequestWithUser, res: Response, next: NextFunction) => {
	if (!req.params.conversationid) return next(new ClientSyntaxError('Missing conversationid'))
	if (!req.params.auth && req.user !== undefined && req.user._id) req.params.auth = req.user._id.toString()

	conversationController.newMessage(
		req.params.conversationid,
		req.params.auth,
		req.body.text,
		req.ip,
		(err, _) => {
			if (err) return next(new InternalServerError(undefined, err))
			conversationController.getConversation(req.params.conversationid, req.params.auth, (err, _) => {
				if (err) return next(new InternalServerError('Could not get conversation', err))
				return res.redirect(`/conversation/${req.params.conversationid}/${req.params.auth || ''}`)
			})
		}
	)
})
export default conversationRouter
