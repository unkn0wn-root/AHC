import { NextFunction, Response, Router } from 'express'
import { accessMiddleware } from '../controllers/access'
import { ActionType, createAction } from '../controllers/actions'
import * as hejtoController from '../controllers/hejto_client'
import confession, { ConfessionStatus } from '../models/confession'
import replyModel, { IReply } from '../models/reply'
import { RequestWithUser } from '../utils'
import { makeAPIResponse } from './utils/response'
import { authentication } from './middleware/authentication'
import { getPage } from './utils/pagination'
import { CommentService } from '../lib/hejto/services'
import {
	InternalServerError,
	ClientSyntaxError,
	NotFoundError
} from '../exceptions/httpExceptions'

export const replyRouter = Router()

type RequestWithReply = RequestWithUser & { reply: IReply }

async function getReplyMiddleware(req: RequestWithReply, res: Response, next: NextFunction) {
	try {
		const reply = await replyModel.findById(req.params.id)

		if (!reply) return next(new NotFoundError('Reply not found'))

		req.reply = reply
		return next()
	} catch (err) {
		return next(new InternalServerError(undefined, err))
	}
}

replyRouter.use(authentication)
replyRouter.get('/', async (req: RequestWithUser, res: Response, next: NextFunction) => {
	try {
		const query =
			replyModel
				.find({}, ['_id', 'text', 'status', 'alias', 'embed', 'auth', 'addedBy'])
				.populate('parentID', 'slug')
				.sort({ _id: -1 })
				.lean()

		const paginationObject = await getPage(req, replyModel, query)
		return res.json(makeAPIResponse(res, paginationObject))
	} catch (err) {
		return next(new InternalServerError(undefined, err))
	}
})

replyRouter.delete('/reply/:id/',
	accessMiddleware('deleteReply'),
	getReplyMiddleware,
	async (req: RequestWithReply, res: Response, next: NextFunction) => {
		try {
			const reply = await req.reply.populate([{ path: 'parentID', select: ['slug', 'actions'] }])

			const commentService = new CommentService(reply.parentID.slug)
			await commentService.deleteComment(reply.commentGuid)

			const action = await createAction(
				req.user._id,
				ActionType.DELETE_REPLY,
				req.reply._id,
			)
			.save()

			reply.parentID.actions.push(action)
			reply.status = ConfessionStatus.DECLINED,
			reply.commentGuid = null

			await Promise.all([reply.save(), reply.parentID.save()])

			return res.json(makeAPIResponse(res,
				{ action, patchObject: {
					status: reply.status,
					commentGuid: reply.commentGuid,
				}},
			))
		} catch (err) {
			return next(new InternalServerError('Could not delete. Internal Server Error occured', err))
		}
	}
)

replyRouter.get('/reply/:id/accept',
	accessMiddleware('addReply'),
	getReplyMiddleware,
	async (req: RequestWithReply, res: Response, next: NextFunction) => {
		const reply = await req.reply.populate([{ path: 'parentID', select: ['slug', 'actions'] }])

		if (reply.commentGuid)
			return next(new ClientSyntaxError('The reply is already added'))

		if (reply.status === ConfessionStatus.DECLINED)
			return next(new ClientSyntaxError('The reply is marked as dangerous. Change status before adding'))

		try {
			const comment = await hejtoController.acceptReply(reply, req.user)
			reply.commentGuid = comment.uuid
			reply.status = ConfessionStatus.ACCEPTED
			reply.addedBy = req.user.username

			const action = await createAction(req.user._id, ActionType.ACCEPT_REPLY, reply._id).save()
			await reply.save()
			await confession.updateOne({ _id: reply.parentID }, { $push: { actions: action } })

			const { status, addedBy, commentGuid } = reply

			return res.json(makeAPIResponse(res, {
				patchObject: { status, addedBy, commentGuid },
				action,
			}))
		} catch (err) {
			return next(new InternalServerError('Could not accept or decline reply', err))
		}
	}
)

replyRouter.put('/reply/:id/status',
	accessMiddleware('setStatus'),
	getReplyMiddleware,
	async (req: RequestWithReply, res: Response, next: NextFunction) => {
		if (!Object.values(ConfessionStatus).includes(req.body.status))
			return next(new ClientSyntaxError('Wrong status'))

		if (req.reply.status === req.body.status)
			return res.status(200).json(makeAPIResponse(res, { patchObject: { status: req.reply.status } }))

		req.reply.status = req.body.status

		const actionType = ActionType.REPLY_CHANGE_STATUS
		const action = await createAction(
			req.user._id,
			actionType,
			`${req.reply._id} => ${ConfessionStatus[req.reply.status]}`).save()

		await confession.updateOne({ _id: req.reply.parentID }, { $push: { actions: action } })

		try {
			await req.reply.save()
			return res.status(200).json(makeAPIResponse(res, { patchObject: { status: req.reply.status }, action }))
		} catch (err) {
			return next(new InternalServerError('Reply was not created. Tango down', err))
		}
	}
)
