export interface OpenConversationModel {
    participants: [
        {
            username: string
        }
    ]
}

export interface CreateConversationModel {
    content: string
}
