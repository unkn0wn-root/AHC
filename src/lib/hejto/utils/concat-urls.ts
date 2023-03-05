const trimEdgeSlashes = (input: string): string => {
	let firstIndex = 0
	let lastIndex = input.length - 1

	while (input[firstIndex] === '/' && firstIndex < lastIndex) {
		firstIndex += 1
	}

	while (input[lastIndex] === '/' && lastIndex > firstIndex) {
		lastIndex -= 1
	}

	return input.substring(firstIndex, lastIndex + 1)
};

export const concatUrls = (...urls: string[]): string => {
	return urls.reduce((a: string, b: string) => `${trimEdgeSlashes(a)}/${trimEdgeSlashes(b)}`)
}
