import './database'
import cookieParser from 'cookie-parser'
import os from 'os'
import crypto from 'crypto'
import express from 'express'
import helmet from 'helmet'
import http from 'http'
import path from 'path'
import apiRouter from './api/api'
import { ActionType, createAction } from './controllers/actions'
import aliasGenerator from './controllers/aliases'
import auth from './controllers/authorization'
import * as tagController from './controllers/tags'
import * as hejtoController from './controllers/hejto_client'
import conversationRouter from './conversation'
import { csrfErrorHander, csrfProtection } from './csrf'
import { logger } from './logger'
import advertismentModel from './models/ads'
import confessionModel from './models/confession'
import replyModel from './models/reply'

const app = express()

app.enable('trust proxy')
app.use(helmet({
	contentSecurityPolicy: false,
	crossOriginEmbedderPolicy: false,
	crossOriginResourcePolicy: false
}))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use(express.static('public'))
app.use('/api', apiRouter)

const frontendStaticPath = path.join(__dirname, '..', 'frontend', 'build', 'static')
const frontendIndex = path.join(__dirname, '..', 'frontend', 'build', 'index.html')

app.use('/mod/static', express.static(frontendStaticPath))
app.use('/mod/static/*', (req, res) => res.send(404))
app.use(['/mod', '/mod/*'], (req, res) => {
	return res.sendFile(frontendIndex)
})

app.use('/conversation', conversationRouter)
app.use(auth(false))
app.set('view engine', 'pug')

app.get('/', csrfProtection, (req, res) => {
	return res.render('index', { csrfToken: (req as any).csrfToken() })
})

app.post('/', csrfProtection, csrfErrorHander, async (req, res) => {
	const confession = new confessionModel()

	if (!req.body.text) return res.sendStatus(400)

	confession.text = req.body.text || ''
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
		.catch(_ => {
			return res.status(500).send({ error: 'Internal Server Error' })
		})
})

app.get('/confession/:confessionid/:auth', (req, res) => {
	if (!req.params.confessionid || !req.params.auth) return res.sendStatus(400)
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
			if (!confession) return res.sendStatus(404)

			return res.render('confession', { confession: confession })
		})
	}
})

app.get('/reply/:confessionid', csrfProtection, (req, res) => {
	confessionModel.findById(req.params.confessionid, (err, confession) => {
		if (err) return res.sendStatus(404)
		hejtoController.getParticipants(confession.slug).then(participants => {
			return res.render('reply', { confession, participants, csrfToken: (req as any).csrfToken() })
		})
		.catch(_ => {
			return res.render('reply', { confession, participants: [], csrfToken: (req as any).csrfToken() })
		})
	})
})

app.post('/reply/:confessionid', csrfProtection, csrfErrorHander, (req, res) => {
	confessionModel.findById(req.params.confessionid)
		.then(async (confession) => {
			if (!confession) return res.sendStatus(404)

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
			return res.status(500).send({ error: 'Internal Server Error' })
		})
})

app.get('/about', (req, res) => {
	return res.render('about')
})

app.get('/contact', (req, res) => {
	return res.render('contact')
})

app.get('/link/:linkId/:from', function(req, res) {
	advertismentModel.findOne({ _id: req.params.linkId }, function(err, ad) {
		if (err || !ad) return res.sendStatus(404)
		ad.visits.push({ IPAdress: req.ip, from: req.params.from })
		ad.save()
		return res.redirect(ad.out)
	})
})

export const server = http.createServer(app)

const _port = process.env.PORT || 8080

/** check memory usage and do not run if less then 1 GB */
const freeMemory = Math.round(os.freemem() / (1024 * 1024));
if (freeMemory < 1024) {
	throw new Error(
		`Cannot run engine if available memory is less then 1024 MiB => Current free memory: ${freeMemory} MiB`
	);
}

server.listen(_port, () => {
	logger.info(`🛡️  Server started on port: ${_port}`)
	logger.info(`🖥️  Running in env: ${process.env.NODE_ENV}`)
	logger.info(`🖥️  Current server available memory: ${freeMemory} MiB`)
})
