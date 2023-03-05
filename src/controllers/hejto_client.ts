import bodyBuildier from './bodyBuildier'
import { createAction, ActionType } from './actions'
import archiveModel from '../models/archive'
import { ConfessionStatus } from '../models/confession'
import { IReply } from '../models/reply'
import { IUser } from '../models/user'
import { PostService, ConversationService, CommentService } from '../lib/hejto/services'

const throwIfNullOrEmpty = <T>(fname: string | undefined, ...value: T[]): void | Error => {
	value.forEach(val => {
		if (!val) throw new Error(`Null or empty values are not allowed. Caller func name: [${fname}]`)
	})
}

export const getParticipants = async (slug: string) => {
	throwIfNullOrEmpty('getParticipants', slug)
	const response = await PostService.getPostComments(slug)
	const mapped = response._embedded.items.map(comment => comment.author.username)
	return Array.from(new Set(mapped).values())
}

export const deleteEntry = async (slug: string) => {
	throwIfNullOrEmpty('deleteEntry', slug)
	const getPost = await PostService.getPost(slug)
	const archivePost = PostService.transformPostObject(getPost)
	const archive = new archiveModel()

	archive.item = archivePost
	await archive.save()

	return await PostService.deletePost(getPost.slug)
}

export const deleteEntryComment = async (postSlug: string, commentUuid: string) => {
	throwIfNullOrEmpty('deleteEntryComment', postSlug, commentUuid)
	const commentService = new CommentService(postSlug)
	const getComment = await commentService.getComment(commentUuid)
	const archiveComment = commentService.archiveComment(getComment)
	const archive = new archiveModel()

	archive.item = archiveComment
	await archive.save()

	return await commentService.deleteComment(getComment.uuid)
}

export const sendPrivateMessage = async (receiver: string, body: string) => {
	throwIfNullOrEmpty('sendPrivateMessage', receiver)
	const conversation = new ConversationService(receiver)
	return await conversation.createConversationMessage({ content: body })
}

export const acceptConfession = async (
	entryBody: string,
	embed: string,
	adultmedia: boolean = false
	) => {
	const isProduction = process.env.NODE_ENV === 'production'
	const post = {
		content: entryBody,
		nsfw: adultmedia,
		tags: [],
		community: isProduction ? 'hydepark' : 'anonimowehejtotesty',
		type: 'discussion'
	}

	return await PostService.createPost(post, embed)
}

export const acceptReply = async (reply: IReply, user: IUser) => {
	throwIfNullOrEmpty('acceptReply', reply.parentID.slug)
	const entryBody = bodyBuildier.getCommentBody(reply, user)
	const commentService = new CommentService(reply.parentID.slug)

	return await commentService.createComment(
		{ content: entryBody }
	)
}

export const acceptReplyAndCreateAction = async (reply: IReply, user: IUser) => {
	const response = await acceptReply(reply, user)
	reply.commentGuid = response.uuid
	reply.status = ConfessionStatus.ACCEPTED
	reply.addedBy = user.username

	const action = await createAction(user._id, ActionType.ACCEPT_REPLY).save()
	reply.parentID.actions.push(action)

	return await Promise.all([reply.parentID.save(), reply.save()]).then(_ => reply)
}
