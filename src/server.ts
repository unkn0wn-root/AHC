import './database'
import {
	Request,
	Response,
	NextFunction,
	Application
} from 'express'
import cookieParser from 'cookie-parser'
import crypto from 'crypto'
import express from 'express'
import helmet from 'helmet'
import path from 'path'
import apiRouter from './api/api'
import { ActionType, createAction } from './controllers/actions'
import aliasGenerator from './controllers/aliases'
import auth from './controllers/authorization'
import * as tagController from './controllers/tags'
import * as hejtoController from './controllers/hejto_client'
import conversationRouter from './services/conversation'
import { csrfErrorHander, csrfProtection } from './csrf'
import logger from './logger'
import advertismentModel from './models/ads'
import confessionModel from './models/confession'
import replyModel from './models/reply'
import {
	requestId,
	logRequest,
	logErrorResponse,
	logOriginError,
	checkRateLimit
} from './api/middleware'
import {
	HttpError,
	InternalServerError,
	NotFoundError,
	ClientSyntaxError
} from './exceptions/httpExceptions';


export async function AHCServer({app}: { app: Application }) {
	app.enable('trust proxy')
	app.set('view engine', 'pug')
	app.set('x-powered-by', false)
	app.use(checkRateLimit)

	app.use(helmet({
		contentSecurityPolicy: false,
		crossOriginEmbedderPolicy: false,
		crossOriginResourcePolicy: false
	}))

	app.use(express.urlencoded({ extended: true }))
	app.use(express.json())
	app.use(cookieParser())
	app.use(express.static('public'))
	app.use(requestId)
	app.use(logRequest)
	app.use('/api', apiRouter)

	const frontendStaticPath = path.join(__dirname, '..', 'frontend', 'build', 'static')
	const frontendIndex = path.join(__dirname, '..', 'frontend', 'build', 'index.html')

	app.use('/mod/static', express.static(frontendStaticPath))
	app.use('/mod/static/*', (req: Request, res: Response, next: NextFunction) => {
		return next(new NotFoundError())
	})
	app.use(['/mod', '/mod/*'], (_: Request, res: Response) => {
		return res.sendFile(frontendIndex)
	})

	app.use('/conversation', conversationRouter)
	app.use(auth(false))

	app.get('/', csrfProtection, (req, res) => {
		return res.render('index', { csrfToken: (req as any).csrfToken() })
	})

	app.post('/', csrfProtection, csrfErrorHander, async (req: Request, res: Response, next: NextFunction) => {
		const confession = new confessionModel()

		if (!req.body.text)
			return res
					.status(400)
					.send('Nie możesz dodać pustego wyznania. Postaraj się napisać coś więcej.')

		confession.text = req.body.text
		confession.IPAdress = req.ip
		confession.remotePort = req.connection.remotePort.toString()
		confession.embed = req.body.embed
		confession.tags = tagController.getTags(req.body.text)
		confession.auth = crypto.randomBytes(7).toString('hex')

		const action = await createAction(null, ActionType.NEW_ENTRY).save()

		confession.actions.push(action)

		confession.save()
			.then(() => {
				return res.redirect(`confession/${confession._id}/${confession.auth}`)
			})
			.catch(err => {
				return next(new InternalServerError('Failed to save confession', err))
			})
	})

	app.get('/confession/:confessionid/:auth', (req: Request, res: Response, next: NextFunction) => {
		if (!req.params.confessionid || !req.params.auth) return next(new ClientSyntaxError())
		else {
			confessionModel.findOne({
				_id: req.params.confessionid,
				auth: req.params.auth,
			})
			.populate([{
					path: 'actions', options: { sort: { _id: -1 } },
					populate: { path: 'user', select: 'username' },
			}])
			.exec((err, confession) => {
				if (err) return res.send(err)
				if (!confession) return next(new NotFoundError())

				return res.render('confession', { confession: confession })
			})
		}
	})

	app.get('/reply/:confessionid', csrfProtection, (req: Request, res: Response, next: NextFunction) => {
		confessionModel.findById(req.params.confessionid, (err, confession) => {
			if (err) return next(new NotFoundError())

			hejtoController.getParticipants(confession.slug).then(participants => {
				return res.render('reply', { confession, participants, csrfToken: (req as any).csrfToken() })
			})
			.catch(_ => {
				return res.render('reply', { confession, participants: [], csrfToken: (req as any).csrfToken() })
			})
		})
	})

	app.post(
		'/reply/:confessionid',
		csrfProtection,
		csrfErrorHander,
		(req: Request, res: Response, next: NextFunction) => {
		confessionModel.findById(req.params.confessionid)
			.then(async (confession) => {
				if (!confession) return next(new NotFoundError())

				const reply = new replyModel()
				reply.text = req.body.text
				reply.IPAdress = req.ip
				reply.remotePort = req.connection.remotePort.toString()
				reply.embed = req.body.embed
				reply.alias = req.body.alias || aliasGenerator()

				if (reply.alias.trim() === confession.auth) {
					reply.alias = 'OP'
					reply.authorized = true
				}
				reply.auth = crypto.randomBytes(5).toString('hex')
				reply.parentID = confession._id

				return reply.save()
					.then(async () => {
						const action = await createAction(null, ActionType.NEW_REPLY, reply._id).save()
						confession.actions.push(action)
						await confession.save()
					})
					.then(() => {
						return res.render('reply', { success: true, reply, confession })
					})
			})
			.catch(err => {
				logger.error('Error inside app.post on confessionid', { msg: err?.message, stack: err?.stack })
				return next(new InternalServerError('Failed to save reply', err))
			})
	})

	app.get('/about', (req, res) => {
		return res.render('about')
	})

	app.get('/contact', (req, res) => {
		return res.render('contact')
	})

	app.get('/link/:linkId/:from', function(req: Request, res: Response, next: NextFunction) {
		advertismentModel.findOne({ _id: req.params.linkId }, function(err, ad) {
			if (err || !ad) return next(new NotFoundError())
			ad.visits.push({ IPAdress: req.ip, from: req.params.from })
			ad.save()

			return res.redirect(ad.out)
		})
	})

	/** Error handlers */
	app.use(logOriginError);

	app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
		const checkErrorType =
			(error instanceof HttpError) ? error : new InternalServerError('Internal Server Error')
		return next(checkErrorType)
	})

	app.use((error: HttpError, request: Request, response: Response, next: NextFunction) => {
		response
		.status(error.statusCode || response.statusCode)
		.json({
			timestamp: new Date().toISOString(),
			status: error.statusCode,
			title: error.title,
			error: error.name,
			message: error.message,
			path: request.path
		});

		return next(error)
	});
	// Log error response
	app.use(logErrorResponse)

	return app
}
