import { Response, Router, NextFunction } from 'express';
import { accessMiddleware } from '../controllers/access'
import { ActionType, createAction } from '../controllers/actions'
import bodyBuilder from '../controllers/bodyBuildier'
import { prepareArrayRefactored } from '../controllers/tags'
import * as hejtoController from '../controllers/hejto_client'
import confessionModel, { ConfessionStatus, IConfession } from '../models/confession'
import { RequestWithUser } from '../utils'
import { HejtoRequestQueue } from '../services/req_queue'
import { authentication } from './middleware/authentication'
import { getPage } from './utils/pagination'
import { makeAPIResponse } from './utils/response'
import {
	InternalServerError,
	NotFoundError,
	ConflictError,
	ClientSyntaxError
} from '../exceptions/httpExceptions';

export const confessionRouter = Router()

type RequestWithConfession<T = any> = RequestWithUser<T> & { confession: IConfession }

export interface AcceptConfessionOptions {
	includeEmbed?: boolean
	includeSurvey?: boolean
	isPlus18?: boolean
}

async function getConfessionMiddleware(req: RequestWithConfession, res: Response, next: NextFunction) {
		try {
			const confession = await confessionModel.findById(req.params.id)

			if (!confession)
				return next(new NotFoundError('Confession not found'))

			req.confession = confession
			return next()
		} catch (err) {
			return next(new InternalServerError('Cannot get confessions. Server error occured', err))
		}
}

confessionRouter.use(authentication)
confessionRouter.get('/', async (req: RequestWithUser, res: Response, next: NextFunction) => {
	try {
		const query = confessionModel
			.find({}, ['_id', 'text', 'status', 'embed', 'auth', 'slug', 'survey'])
			.sort({ _id: -1 })
			.lean()

		const paginationObject = await getPage(req, confessionModel, query)
		return res.json(makeAPIResponse(res, paginationObject))
	} catch (err) {
		return next(new InternalServerError('Cannot get confessions. Server error occured', err))
	}
})

confessionRouter.get('/confession/:id',
	accessMiddleware('viewDetails'),
	getConfessionMiddleware, async (req: RequestWithConfession, res: Response, next: NextFunction) => {
		try {
			const confession = await req.confession.populate([
				{
					path: 'actions', options: { sort: { _id: -1 } },
					populate: { path: 'user', select: 'username' },
				},
				{ path: 'survey' },
			])
			return res.json(makeAPIResponse(res, confession))
		} catch (err) {
			return next(new InternalServerError('Sorry, we have some rusty servers right now...', err))
		}
	}
)

confessionRouter.delete('/confession/:id',
	accessMiddleware('deleteEntry'),
	getConfessionMiddleware, async (req: RequestWithConfession, res: Response, next: NextFunction) => {
		try {
			await hejtoController.deleteEntry(req.confession.slug)
			const action = await createAction(req.user._id, ActionType.DELETE_ENTRY).save()

			req.confession.status = ConfessionStatus.DECLINED
			req.confession.actions.push(action)
			req.confession.save((err) => {
				if (err) {
					return res.json(
						{ success: false, response: { message: err } }
					)
				}

				HejtoRequestQueue.addTask(() => hejtoController.sendPrivateMessage(
					'HannibalLecter', `${req.user.username} usunął wpis \n ${req.confession.slug}`,
				))

				const { status } = req.confession

				return res.json(makeAPIResponse(res, {
					message: `Usunięto wpis ID: ${req.confession.slug}`,
					patchObject: { status },
					action,
				}))
			})
		} catch (err) {
			return next(new InternalServerError('Confession was not deleted', err))
		}
	}
)

confessionRouter.post('/confession/:id/accept',
	accessMiddleware('addEntry'),
	getConfessionMiddleware,
	async (req: RequestWithConfession<AcceptConfessionOptions>, res: Response, next: NextFunction) => {
		const confession = req.confession
		if (confession.slug && confession.status === ConfessionStatus.ACCEPTED) {
			return res
				.status(409).json(
					makeAPIResponse(res, null, { message: 'Entry is already added.' }),
				)
		}

		if (confession.status === ConfessionStatus.DECLINED) {
			return next(new ConflictError('Cannot add declined entry'))
		}

		try {
			const entryBody = await bodyBuilder.getEntryBody(confession, req.user)
			const adultMedia = req.body.isPlus18 || confession.tags.map(x => x[0]).includes('#nsfw')
			const embed = req.body.includeEmbed ? confession.embed : undefined
			const response = await hejtoController.acceptConfession(entryBody, embed, adultMedia)

			confession.slug = response.slug

			const action = await createAction(req.user._id, ActionType.ACCEPT_ENTRY).save()

			confession.actions.push(action)
			confession.status = ConfessionStatus.ACCEPTED
			confession.addedBy = req.user.username

			confession.save().then(() => {
				const { status, addedBy, slug } = confession
				return res.json(makeAPIResponse(res, {
					patchObject: { status, addedBy, slug },
					action,
				}))
			})
		} catch(err) {
			return next(new InternalServerError('Sorry, we have some rusty servers right now...', err))
		}
	}
)

confessionRouter.put('/confession/:id/status',
	accessMiddleware('setStatus'),
	getConfessionMiddleware,
	async (req: RequestWithConfession, res: Response, next: NextFunction) => {
		if (!Object.values(ConfessionStatus).includes(req.body.status))
			return next(new ClientSyntaxError('Wrong status'))

		if (req.confession.status === req.body.status)
			return res.status(200).json(makeAPIResponse(res, { patchObject: { status: req.confession.status } }))

		const note = req.body.note
		req.confession.status = req.body.status

		const actionType = req.body.status === ConfessionStatus.DECLINED ?
			ActionType.DECLINE_ENTRY
			: ActionType.REVERT_ENTRY_DECLINE

		const action = await createAction(req.user._id, actionType, note).save()
		req.confession.actions.push(action)

		try {
			await req.confession.save()
			return res.status(200)
				.json(makeAPIResponse(res, { patchObject: { status: req.confession.status }, action }))
		} catch (err) {
			return next(new InternalServerError('Status was not updated', err))
		}
	}
)

confessionRouter.put('/confession/:id/tags',
	accessMiddleware('updateTags'),
	getConfessionMiddleware,
	async (
		req: RequestWithConfession & {body: {tag: string, tagValue: boolean}},
		res: Response,
		next: NextFunction
		) => {
		const tagValue = req.body.tagValue
		const action = await createAction(
			req.user._id,
			ActionType.UPDATED_TAGS,
			`${req.body.tag} ${tagValue ? '✓' : '✗'}`)
			.save()

		const newTags = prepareArrayRefactored(req.confession.tags, req.body.tag, tagValue)

		try {
			await req.confession.updateOne({
				$set: {
					tags: newTags,
				},
				$push: { actions: action._id },
			})

			return res.status(200).json(makeAPIResponse(res, { patchObject: { tags: newTags }, action }))
		} catch (err) {
			return next(new InternalServerError('Tags were not updated', err))
		}
	}
)

confessionRouter.get('/confession/:id/ip',
	accessMiddleware('viewDetails'),
	accessMiddleware('viewIP'),
	async (req: RequestWithConfession, res: Response, next: NextFunction) => {
		try {
			const confession = await confessionModel.findById(req.params.id)
				.select('_id IPAdress')

			if (!confession)
				return next(new NotFoundError())

			return res.status(200).json(makeAPIResponse(res, confession))
		} catch (err) {
			return next(new InternalServerError('IP could not be retrieved. Server error', err))
		}
	}
)

confessionRouter.get('/confession/:id/otherFromIp',
	accessMiddleware('viewDetails'),
	getConfessionMiddleware,
	async (req: RequestWithConfession, res: Response, next: NextFunction) => {
		try {
			const confessions = await confessionModel
				.find({ IPAdress: req.confession.IPAdress }, { _id: 1, status: 1 })
				.sort({ _id: -1 })

			return res.json(makeAPIResponse(res, { confessions }))
		} catch (err) {
			return next(new InternalServerError('IP could not be retrieved. Server error', err))
		}
	}
)
