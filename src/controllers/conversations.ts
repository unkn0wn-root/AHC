import config from '../config'
import * as hejtoController from './hejto_client'
import conversationModel from '../models/conversation'
import { HejtoRequestQueue } from '../service/req_queue'

export function createNewConversation(parentObject, cb) {
	let userFlag: boolean
	const conversation = new conversationModel()

	if ('username' in parentObject) {
		conversation.userID = parentObject._id
		userFlag = true
	} else {
		conversation.parentID = parentObject._id
	}

	conversation.save((err, conversation) => {
		if (err) return cb(err)

		if (!userFlag) {
			parentObject.conversations.push(conversation._id)
			parentObject.save((err) => {
				if (err) { return cb(err) }
				cb(null, conversation._id)
			})
		} else {
			HejtoRequestQueue.addTask(() => hejtoController.sendPrivateMessage(
				parentObject.username,
				`Nowa wiadomość na anonimowychhejtowyznaniach ${config.siteURL}/mod/conversations`,
			))

			return cb(null, conversation._id)
		}
	})
}

export function validateAuth(conversationId, auth, cb) {
	conversationModel.findOne({ _id: conversationId }).populate('parentID', 'auth').exec((err, conversation) => {
		if (err) return cb(err)
		if (!conversation) return cb('nie odnaleziono konwersacji')

		if (typeof conversation.userID !== 'undefined' && conversation.userID._id.toString() === auth) {
			return cb(null, true)
		}

		if (typeof conversation.parentID !== 'undefined' && conversation.parentID.auth === auth) {
			return cb(null, true)
		}

		cb(null, false)
	})
}

export function getConversation(conversationId, auth, cb) {
	conversationModel.findOne({ _id: conversationId })
		.populate([{ path: 'parentID', select: 'auth' }, { path: 'userID', select: '_id username' }])
		.exec((err, conversation) => {
			if (err) return cb(err)
			if (!conversation) return cb('nie odnaleziono konwersacji')

			if (typeof conversation.userID !== 'undefined'
				&& auth &&
				conversation.userID._id.toString() === auth.substr(2)
			) {
				conversation.auth = conversation.userID._id
			}

			if (typeof conversation.parentID !== 'undefined' && conversation.parentID.auth === auth) {
				conversation.auth = conversation.parentID.auth
			}

			return cb(err, conversation)
		})
}

export function newMessage(conversationId, auth, text, IPAdress, cb) {
	conversationModel.findOne({ _id: conversationId }, { '_id': 1, 'parentID': 1, 'userID': 1 })
		.populate([{ path: 'parentID', select: 'auth' }, { path: 'userID', select: '_id username' }])
		.exec((err, conversation) => {
			if (err) return cb(err)
			if (!text) return cb('Wpisz tresc wiadomosci')
			if (!conversation) return cb('Nie odnaleziono konwersacji')

			let isOP = false
			let userObject = null

			if (conversation.userID !== undefined && conversation.userID._id.toString() === auth) {
				isOP = true
				userObject = conversation.userID._id
			}

			if (conversation.parentID !== undefined && conversation.parentID.auth === auth) {
				isOP = true
			}

			conversationModel.findOneAndUpdate({ _id: conversationId },
				{ $push:
					{ messages: { time: new Date(), text: text, IPAdress: IPAdress, OP: isOP, user: userObject } },
				})
				.then(() => {cb(null, isOP)})
				.catch((err) => {cb(err)})
		})
}
