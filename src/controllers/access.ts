import { ForbiddenError } from '../exceptions/httpExceptions'

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
	return (!(permission in permissionObject))
	? userFlag
	: userFlag ^= (permissionObject[permission])
}

export function getFlagPermissions(flag: number) {
	const allowed = {}
	permissions.forEach(permission => {
		allowed[permission] = checkIfIsAllowed(flag, permission)
	})

	return allowed
}

export const accessMiddleware = (permission: permissionType) => (req, res, next) => {
	if (!req.user || !checkIfIsAllowed(req.user.flags, permission)) {
		return next(new ForbiddenError('You\'re not allowed to perform this action'))
	}

	return next()
}

