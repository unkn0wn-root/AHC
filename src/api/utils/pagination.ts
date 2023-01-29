import { Request } from 'express'
import { Model, Query } from 'mongoose'

const DEFAULT_PER_PAGE = 25

export type PaginationQueryParams = {
    page?: string
    perPage?: string
}

interface RequestWithPaginationQueryParams extends Request{
    query: PaginationQueryParams
}

export async function getPage(
	req: RequestWithPaginationQueryParams,
	model: Model<any>,
	query: Query<any, any>,
) {
	const page = Math.max(Number(req.query.page), 0)
	const perPage = Number(req.query.perPage) || DEFAULT_PER_PAGE
	const count: number = await model.estimatedDocumentCount()

	const pageItems = await query
		.limit(perPage)
		.skip(page * perPage)

		return { pageItems, count }
}
