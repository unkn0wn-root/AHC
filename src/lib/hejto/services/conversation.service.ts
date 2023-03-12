import { IHejtoProvider } from '../interfaces/hejto-provider.interface'
import { HejtoProvider } from './hejto-provider'
import { parseUuid } from './services-utils'
import { concatUrls } from '../utils/concat-urls'
import {
    OpenConversationModel,
    CreateConversationModel,
    CreateMessageCovertationModel
} from '../models'

class ConversationService {
    private get _hejto(): IHejtoProvider {
		return new HejtoProvider()
	}

    private _conversationUuid: string
    private _username: string
    private _conversationMessageUuid: string

    constructor(uname: string) {
        this._username = uname
    }

    public get conversationUuid() {
        return this._conversationUuid
    }

    public get conversationUserName() {
        return this._username
    }

    public get conversationMessageUuid() {
        return this._conversationMessageUuid
    }
    /**
     * We need to first create conversation with one request where we get uuid back
     * and then, we need to use that uuid to send private messages
     * @param content: CreateConversationModel
     * @returns true if status below 400
     */
    public async createConversationMessage(content: CreateConversationModel): Promise<boolean> {
        await this.createConversation()

        const postMessage =
            (
                await this._hejto.send(
                    concatUrls('conversations', this._conversationUuid, 'messages'), {}, {},
                    { method: 'POST', data: content }
                )
            )
            .headers
            .location

        this._conversationMessageUuid = parseUuid(postMessage, 3)

        return postMessage.status < 400
    }
    // This is private because we always need to call this for each new conversation - existing ones can use same uuid
    private async createConversation(): Promise<void> {
        const conversationModel = {
            participants: [
                {
                    username: this._username
                }
            ]
        }

        const conversationCreated = (
            await this._hejto.send<OpenConversationModel & CreateMessageCovertationModel>(
                'conversations', {}, {}, { method: 'POST', data: conversationModel as any }
            )
        )

        conversationCreated?.data?.uuid
        ? this._conversationUuid = conversationCreated.data.uuid
        : this._conversationUuid = parseUuid(conversationCreated.headers.location, 1)
    }
}

export { ConversationService }
