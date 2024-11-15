import { Hono } from 'hono'
import { Bindings } from '../types'
import oauthRoutes from './oauth'
import s3Routes from './s3'
import fileRoutes from './file'

export default new Hono<{
    Bindings: Bindings
}>()
    .route('/oauth', oauthRoutes)
    .route('/s3', s3Routes)
    .route('/file', fileRoutes)
    .all("*", async c => {
        return c.json({ error: "Not Found", success: false })
    })

