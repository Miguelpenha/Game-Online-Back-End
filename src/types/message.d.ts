import IUser from './user'
import ICreated from './created'

interface IMessage {
    id: string
    user: IUser
    text: string
    reply?: IMessage
    created: ICreated
}

export default IMessage