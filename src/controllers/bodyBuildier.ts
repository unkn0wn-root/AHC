/* eslint-disable max-len */
import * as tagController from './tags'
import adsModel from '../models/ads'
import config from '../config'
import { IConfession } from '../models/confession'
import { IUser } from '../models/user'

const getBody = (confession: IConfession, user: IUser) => {
	const confessionMessage = confession.text.replace(/\r/g, '\n')
	return process.env.NODE_ENV === 'development' ?
		`${confessionMessage}\n\n \n${confession._id}\n\n \n#HejtoAPITesty \n`
		:
		`#anonimowehejtowyznania\n\n \n\n${confessionMessage}\n\n \n\n\\---\n\n[Kliknij tutaj, aby odpowiedzieć w tym wątku anonimowo](${config.siteURL}/reply/${confession._id}) \n[Kliknij tutaj, aby wysłać OPowi anonimową wiadomość prywatną](${config.siteURL}/conversation/${confession._id}/new) \nID: #${confession._id}\nPost dodany za pomocą AnonimoweHejtoWyznania: ${config.siteURL} - Zaakceptowane przez: [${user.username}](${config.siteURL}/conversation/U_${user.username}/new)`
}

async function getEntryBody(confession, user) {
	let entryBody = ''
	entryBody += tagController.trimTags(getBody(confession, user), confession.tags)
	const randomAd = await adsModel.random()
	if (randomAd) {
		const caption = randomAd.captions[Math.floor(Math.random() * randomAd.captions.length)]
		entryBody += `\n[${caption}](${randomAd.out})`
	}

	return entryBody
}

function getCommentBody(reply, user) {
	const replyMessage = reply.text.replace(/\r/g, '\n')
	const authorizedMsg = reply.authorized ? '\n**Ten komentarz został dodany przez osobę dodającą wpis (OP)**\n\n' : ''
	return `**${reply.alias}**: ${replyMessage}\n\n \n\\---\n${authorizedMsg} \nZaakceptował: [${user.username}](${config.siteURL}/conversation/U_${user.username}/new)`
}

export default { getEntryBody, getCommentBody }
