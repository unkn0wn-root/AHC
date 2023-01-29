import { makeAPIResponse } from '../api/utils/response'

const permissions = [
	'addEntry', 'deleteEntry', 'addReply', 'deleteReply', 'setStatus', 'viewDetails', 'updateTags', 'accessPanel',
	'accessMessages', 'accessModsList', 'canChangeUserPermissions', 'viewIP'
] as const

type permissionType = typeof permissions[number]

const permissionObject = {}
permissions.forEach((permission, index) => {
	permissionObject[permission] = 1 << index
})

export function checkIfIsAllowed(flag: number, action: string) {
	if (Array.isArray(flag)) {
		for (const permission of flag) {
			const isAllowed = Boolean(permission & permissionObject[action])
			if (isAllowed) return isAllowed
		}
		return false
	}

	return Boolean(flag & permissionObject[action])
}

export function flipPermission(userFlag: number, permission = '') {
	if ( !(permission in permissionObject) ) return userFlag
	return userFlag ^= (permissionObject[permission])
}

export function getFlagPermissions(flag: number) {
	const allowed = {}
	permissions.forEach(permission => {
		allowed[permission] = checkIfIsAllowed(flag, permission)
	})

	return allowed
}

type getErrorObjectT = (res) => object
const accessMiddleware = (
	permission: permissionType,
	getErrorObject: getErrorObjectT
	) => (req, res, next) => {
	if (!req.user || !checkIfIsAllowed(req.user.flags, permission)) {
		return res
			.status(403)
			.json(getErrorObject(res))
	}

	return next()
}

const messageText = 'You\'re not allowed to perform this action'

export function accessMiddlewareV1(permission: permissionType) {
	const getErrorObject = () => ( { success: false, response: { message: messageText } })
	return accessMiddleware(permission, getErrorObject)
}

export function accessMiddlewareV2(permission: permissionType) {
	const getErrorObject = (res) => makeAPIResponse(res, null, { message: messageText })
	return accessMiddleware(permission, getErrorObject)
}
