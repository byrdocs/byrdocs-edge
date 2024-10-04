import { Hono } from 'hono'
import { Bindings } from '../types'
import { OAuth } from '../objects/oauth';
import oauthRoutes from './oauth'
import s3Routes from './s3'

export default new Hono<{
    Bindings: Bindings
}>()
    .route('/oauth', oauthRoutes)
    .route('/s3', s3Routes)

