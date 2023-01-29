export const parseUuid = (location: string, index: number): string => {
	const regexUuid = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
	const getUuidFromLocation = location.split('/')[index]

	if (!getUuidFromLocation)
		throw new Error('Got null or empty string which is not allowed')

	if (!regexUuid.test(getUuidFromLocation))
		throw new Error(`Parsed sting (${getUuidFromLocation}) is not a valid UUID`)

	return getUuidFromLocation
}
