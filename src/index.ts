import 'dotenv/config'
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import morgan from 'morgan'
import cors from 'cors'
import { greenBright as success } from 'chalk'
import helmet from 'helmet'
import { IMessage, IUser } from './types'
import names from './utils/names'
import { v4 } from 'uuid'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: process.env.URLS_AUTHORIZED
    }
})

app.use(express.json())
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(express.urlencoded({ extended: true }))

app.use(morgan('dev'))

app.use(cors({
    credentials: true,
    optionsSuccessStatus: 200,
    origin: process.env.URLS_AUTHORIZED.split(',')
}))
console.log(success('>> Cors being used'))

app.use(helmet())
console.log(success('>> Helmet being used'))

let users: IUser[] = []
let chat: IMessage[] = []

io.on('connection', socket => {
    socket.on('disconnect', async () => {
        const newsUsers: IUser[] = []

        const disconnectedUser = (await Promise.all(
            users.map(user => {
                if (user.id != socket.id) {
                    newsUsers.push(user)
                } else {
                    return user
                }
            })
        ))[0]

        chat.push({
            user: {
                id: 'system',
                name: 'Sistema 🤖',
                created: {
                    system: new Date(),
                    date: new Date().toLocaleDateString('pt-br', { timeZone: 'UTC' }),
                    hour: new Date().toLocaleTimeString('pt-br', {
                        timeZone: 'UTC',
                        timeStyle: 'short'
                    })
                }
            },
            id: v4(),
            text: `${disconnectedUser.name} saiu ;-;`,
            created: {
                system: new Date(),
                date: new Date().toLocaleDateString('pt-br', { timeZone: 'UTC' }),
                hour: new Date().toLocaleTimeString('pt-br', {
                    timeZone: 'UTC',
                    timeStyle: 'short'
                })
            }
        })

        users = newsUsers

        const newChat: IMessage[] = []

        chat.map(message => {
            if (message.user.id != socket.id) {
                if (message.reply && message.reply.user.id === socket.id) {
                    newChat.push({
                        ...message,
                        reply: null
                    })
                } else {
                    newChat.push(message)
                }
            }
        })

        chat = newChat

        socket.broadcast.emit('users', users)
        io.emit('chat', chat)
    })

    socket.on('getUsers', () => io.to(socket.id).emit('users', users))

    socket.on('createUser', () => {
        const random = Math.floor(Math.random()*names.length)
        const name = names[random]

        let userIsExists = false

        users.map(user => {
            if (user.id === socket.id) {
                userIsExists = true
            } else {
                io.to(socket.id).emit('userCreated', user)
            }
        })

        if (!userIsExists) {
            const user = {
                id: socket.id,
                name: `${name} anônimo`,
                created: {
                    system: new Date(),
                    date: new Date().toLocaleDateString('pt-br', { timeZone: 'UTC' }),
                    hour: new Date().toLocaleTimeString('pt-br', {
                        timeZone: 'UTC',
                        timeStyle: 'short'
                    })
                }
            }

            users.push(user)

            chat.push({
                user: {
                    id: 'system',
                    name: 'Sistema 🤖',
                    created: {
                        system: new Date(),
                        date: new Date().toLocaleDateString('pt-br', { timeZone: 'UTC' }),
                        hour: new Date().toLocaleTimeString('pt-br', {
                            timeZone: 'UTC',
                            timeStyle: 'short'
                        })
                    }
                },
                id: v4(),
                text: `${user.name} entrou 😃`,
                created: {
                    system: new Date(),
                    date: new Date().toLocaleDateString('pt-br', { timeZone: 'UTC' }),
                    hour: new Date().toLocaleTimeString('pt-br', {
                        timeZone: 'UTC',
                        timeStyle: 'short'
                    })
                }
            })
    
            io.to(socket.id).emit('userCreated', user)

            socket.broadcast.emit('users', users)
            io.emit('chat', chat)
        }
    })

    socket.on('getChat', () => io.to(socket.id).emit('chat', chat))

    socket.on('createMessage', (user: IUser, text: string, reply?: IMessage) => {
        const message: IMessage = {
            user,
            text,
            reply,
            id: v4(),
            created: {
                system: new Date(),
                date: new Date().toLocaleDateString('pt-br', { timeZone: 'UTC' }),
                hour: new Date().toLocaleTimeString('pt-br', {
                    timeZone: 'UTC',
                    timeStyle: 'short'
                })
            }
        }

        chat.push(message)

        io.emit('chat', chat)
    })
    
    socket.on('deleteMessage', (message: IMessage) => {
        const newChat: IMessage[] = []

        chat.map(messageMap => {
            if (messageMap.id != message.id) {
                if (messageMap.reply && messageMap.reply.id === message.id) {
                    newChat.push({
                        ...messageMap,
                        reply: null
                    })
                } else {
                    newChat.push(messageMap)
                }
            }
        })

        chat = newChat

        io.emit('chat', chat)
    })
})

server.listen(process.env.PORT, () => console.log(success('>> Server is running')))