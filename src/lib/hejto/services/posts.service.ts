import axios from 'axios'
import { IHejtoProvider } from '../interfaces/hejto-provider.interface'
import { HejtoProvider } from './hejto-provider'
import { concatUrls } from '../utils/concat-urls';
import {
	PostModel,
	PostApiModel,
	ArchivePost,
	PostComments
} from '../models'
import logger from '../../../logger'
import FormData from 'form-data'
import { Stream } from 'form-data'

interface IUploadResponse {
	uuid: string,
	urls?: {[key: string]: string}
	error: boolean
}

abstract class PostService {
	private static get _hejto(): IHejtoProvider {
		return new HejtoProvider()
	}

	public static async createPost(post: PostModel, embed?: string): Promise<{slug: string}>
	{
		exitIfNoUuid: if (embed) {
			const fileName = this.getFileNameFromUrl(embed)
			const image = await this.downloadImageFromEmbed(embed)

			if (!image.error) {
				const uploadedImageUuid = await this.uploadImageToHejtoS3(fileName, image.value)

				if (!uploadedImageUuid.uuid) break exitIfNoUuid

				post.images = [
					{
						uuid:  uploadedImageUuid.uuid,
						position: 1
					}
				]
			}
		} else {
			post.images = []
		}

		const postData = (
			await this._hejto.send(
				'posts', {}, {}, { method: 'POST', data: post }
			)
		)
		.headers
		.location

		return {
			slug: this.throwIfUndefinedOrNull(
				postData.split('/').filter(i => !!i)[1], '[createPost] Empty slug response. Got undefined from index'
			)
		}
	}

	public static async getPost(postSlug: string): Promise<PostApiModel> {
		return (
			await this._hejto.send<PostApiModel>(
				concatUrls('posts', postSlug), {}, {}, { method: 'GET' }
			)
		)
		.data
	}

	public static async getPostComments(postSlug: string): Promise<PostComments> {
		return (
			await this._hejto.send<PostComments>(
				concatUrls('posts', postSlug, 'comments'), {}, {}, { method: 'GET' }
			)
		)
		.data
	}

	public static async deletePost(postSlug: string) {
		return (
			await this._hejto.send(
				concatUrls('posts', postSlug), {}, {}, { method: 'DELETE' }
			)
		)
	}

	public static transformPostObject(originalPost: PostApiModel): ArchivePost {
		return {
			type: originalPost.type,
			title: originalPost.title,
			slug: originalPost.slug,
			content: originalPost.content,
			status: originalPost.status,
			images: originalPost.images,
			author: originalPost.author,
			tags: originalPost.tags,
			community: originalPost.community,
			nsfw: originalPost.nsfw,
			num_likes: originalPost.num_likes,
			num_comments: originalPost.num_comments,
			created_at: originalPost.created_at,
			updated_at: originalPost.updated_at,
			links: originalPost._links
		}
	}

	private static async uploadImageToHejtoS3(
		fileName: string,
		imageStream: Stream
		): Promise<IUploadResponse> {
		try {
			const imageData = new FormData()
			imageData.append('image', imageStream)
			const uploadResult = (
				await this._hejto.send(
					'uploads?target=post', {}, {
							...imageData.getHeaders()
						},
					{
						method: 'POST',
						data: imageData
					}
				)
			)
			.data as unknown as IUploadResponse

			return {
				uuid: uploadResult.uuid,
				urls: uploadResult.urls,
				error: false
			}
		}
		catch (err) {
			logger.error('Could not upload image to Hejto S3', { msg: err?.message, stack: err?.stack })
			return {
				uuid: null,
				error: true
			}
		}
	}

	private static async downloadImageFromEmbed(url: string): Promise<{error: boolean, value: Stream}> {
		try {
			const result = (await axios.get(url, {
				responseType: 'stream'
			}))
			.data

			return {
				error: false,
				value: result
			}
		}
		catch (err) {
			logger.error('Image could not be downloaded', { msg: err?.message, stack: err?.stack })
			return {
				error: true,
				value: null
			}
		}
	}

	private static getFileNameFromUrl(url: string): string {
		return url.split('/').slice(-1)[0]
	}

	private static throwIfUndefinedOrNull<T>(value: T | undefined, errorMsg: string): T {
		if (!value) throw new Error(errorMsg)
		return value
	}
}

export { PostService }
