import { IHejtoProvider } from '../interfaces/hejto-provider.interface'
import { HejtoProvider } from './hejto-provider'
import { concatUrls } from '../utils'
import {
	UserProfileModel
} from '../models'

class UserService {
	public static async getModel(username: string): Promise<UserProfileModel> {
		const hejtoService: IHejtoProvider = new HejtoProvider()
		return (
			await hejtoService.send<UserProfileModel>(concatUrls('users', username))
		)
		.data
	}
}

export { UserService }
