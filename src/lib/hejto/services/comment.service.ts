import { IHejtoProvider } from '../interfaces/hejto-provider.interface'
import { HejtoProvider } from './hejto-provider'
import { parseUuid } from './services-utils'
import { concatUrls } from '../utils/concat-urls'
import {
	CommentModel,
	PostAPIComment,
	ArchiveComment
} from '../models'


class CommentService {
	private get _hejto(): IHejtoProvider {
		return new HejtoProvider()
	}
	private _postSlug: string
	private _commentUuid: string

	constructor(postSlug: string) {
		this._postSlug = postSlug
	}
	/**
	 * Create hejto comment with a given string
	 * @param comment: CommentModel
	 * @returns comment uuid
	 */
	public async createComment(comment: CommentModel): Promise<{uuid: string}>
	{
		const postComment: string = (
			await this._hejto.send(
				concatUrls('posts', this._postSlug, 'comments'), {},
				{ method: 'POST', data: comment }
			)
		)
		.headers
		.location

		this._commentUuid = parseUuid(postComment, 3)

		return {
			uuid: this._commentUuid
		}
	}
	/**
	 * @param commentUuid: string (optional)
	 * @returns comments data
	 */
	public async getComment(commentUuid: string = this._commentUuid): Promise<PostAPIComment> {
		return (
			await this._hejto.send<PostAPIComment>(
				concatUrls('posts', this._postSlug, 'comments', commentUuid), {}, { method: 'GET' }
			)
		)
		.data
	}
	/**
	 * @param commentUuid string (optional)
	 * @returns true if status below 400, else false
	 */
	public async deleteComment(commentUuid: string = this._commentUuid): Promise<boolean> {
		const status = await this._hejto.send(
			concatUrls('posts', this._postSlug, 'comments', commentUuid), {}, { method: 'DELETE' }
		)

		return status.status < 400
	}

	// Don't need every property for archive so custom method to transform origin comment
	public archiveComment(originalComment: PostAPIComment): ArchiveComment {
		return {
			content: originalComment.content,
			content_plain: originalComment.content_plain,
			status: originalComment.status,
			post: originalComment.post,
			author: originalComment.author.username,
			images: originalComment.images,
			num_likes: originalComment.num_likes,
			num_reports: originalComment.num_reports,
			created_at: originalComment.created_at,
			updated_at: originalComment.updated_at,
			comment_uuid: originalComment.uuid,
			links: originalComment._links
		}
	}
}

export { CommentService }
