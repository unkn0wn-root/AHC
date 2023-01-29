import { NextFunction, Response, Router } from 'express'
import { accessMiddlewareV2 } from '../controllers/access'
import { ActionType, createAction } from '../controllers/actions'
import * as hejtoController from '../controllers/hejto_client'
import { logger } from '../logger'
import confession, { ConfessionStatus } from '../models/confession'
import replyModel, { IReply } from '../models/reply'
import { RequestWithUser } from '../utils'
import { makeAPIResponse } from './utils/response'
import { authentication } from './middleware/authentication'
import { getPage } from './utils/pagination'
import { CommentService } from '../lib/hejto/services'

export const replyRouter = Router()

type RequestWithReply = RequestWithUser & { reply: IReply }

async function getReplyMiddleware(req: RequestWithReply, res: Response, next: NextFunction) {
	try {
		const reply = await replyModel.findById(req.params.id)

		if (!reply) return res.status(404)

		req.reply = reply
		return next()
	} catch (err) {
		logger.error('GET - Reply Middleware Error', { errMsg: err?.message, stack: err.stack })
		return res.status(500).send(makeAPIResponse(res, null, { message: 'Internal Server Error' }))
	}
}

replyRouter.use(authentication)
replyRouter.get('/', async (req: RequestWithUser, res) => {
	try {
		const query = replyModel
						.find({}, ['_id', 'text', 'status', 'alias', 'embed', 'auth', 'commentSlug', 'addedBy'])
						.populate('parentID', 'slug')
						.sort({ _id: -1 })
						.lean()

		const paginationObject = await getPage(req, replyModel, query)
		return res.json(makeAPIResponse(res, paginationObject))
	} catch (err) {
		logger.error('GET - Reply Error', { errMsg: err?.message, stack: err.stack })
		return res.status(500).send(makeAPIResponse(res, null, { message: 'Internal Server Error' }))
	}
})

replyRouter.delete('/reply/:id/',
	accessMiddlewareV2('deleteReply'),
	getReplyMiddleware,
	async (req: RequestWithReply, res) => {
		try {
			const commentService = new CommentService(req.reply.commentSlug)
			await commentService.deleteComment()

			const reply = await req.reply.populate([{ path: 'parentID', select: ['slug', 'actions'] }])

			const action = await createAction(
				req.user._id,
				ActionType.DELETE_REPLY,
				req.reply._id,
			).save()

			reply.parentID.actions.push(action)
			reply.status = ConfessionStatus.DECLINED,
			reply.commentSlug = null

			await Promise.all([reply.save(), reply.parentID.save()])

			return res.json(makeAPIResponse(res,
				{ action, patchObject: {
					status: reply.status,
					commentID: reply.commentSlug,
				}},
			))
		}
		catch (err) {
			logger.error('DELETE - Reply Error', { errMsg: err?.message, stack: err.stack })
			return res.status(500)
				.send(makeAPIResponse(res, null, { message: 'Could not delete. Internal Server Error occured' }))
		}
	}
)

replyRouter.get('/reply/:id/accept',
	accessMiddlewareV2('addReply'),
	getReplyMiddleware,
	async (req: RequestWithReply, res) => {
		const reply = await req.reply.populate([{ path: 'parentID', select: ['slug', 'actions'] }])

		if (reply.commentSlug)
			return res.status(400).json(makeAPIResponse(res, null, { message: 'The reply is already added' }))

		if (reply.status === ConfessionStatus.DECLINED) {
			return res.status(400).json(makeAPIResponse(res, null, {
				message: 'The reply is marked as dangerous. Change status before adding',
			}))
		}

		try {
			const comment = await hejtoController.acceptReply(reply, req.user)
			reply.commentSlug = comment.uuid
			reply.status = ConfessionStatus.ACCEPTED
			reply.addedBy = req.user.username

			const action = await createAction(req.user._id, ActionType.ACCEPT_REPLY, reply._id).save()
			await reply.save()
			await confession.updateOne({ _id: reply.parentID }, { $push: { actions: action } })

			const { status, addedBy, commentSlug } = reply
			return res.json(makeAPIResponse(res, {
				patchObject: { status, addedBy, commentSlug },
				action,
			}))
		} catch (err) {
			logger.error('GET - Reply Accept Error', { errMsg: err?.message, stack: err.stack })
			return res.status(500).send(makeAPIResponse(res, null, { message: 'Could not accept or decline reply' }))
		}
	}
)

replyRouter.put('/reply/:id/status',
	accessMiddlewareV2('setStatus'),
	getReplyMiddleware,
	async (req: RequestWithReply, res) => {
		if (!Object.values(ConfessionStatus).includes(req.body.status))
			return res.status(400).json(makeAPIResponse(res, null, { message: 'Wrong status' }))

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
			logger.error('PUT - Reply Status Error', { errMsg: err?.message, stack: err.stack })
			return res.status(500).send(makeAPIResponse(res, null, { message: 'Reply was not created. Tango down' }))
		}
	}
)
