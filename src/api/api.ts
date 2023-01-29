import { Router } from 'express'
import { confessionRouter } from './confessionRouter'
import { replyRouter } from './replyRouter'
import { userRouter } from './userRouter'

const apiRouter = Router()
apiRouter.get('/', (req, res) => {
	res.json('API v1')
})

apiRouter.use('/users', userRouter)
apiRouter.use('/confessions', confessionRouter)
apiRouter.use('/replies', replyRouter)

export default apiRouter
