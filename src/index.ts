import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt'
import { serveStatic } from 'hono/cloudflare-workers'

import { Counter } from './counter';
export { Counter } from './counter';

import { createChecker } from 'is-in-subnet';
import { buptSubnets } from '../bupt';

import loginHTML from './login.html';
import { login } from './login';

import manifest from '__STATIC_CONTENT_MANIFEST'

type Bindings = {
	COUNTER: DurableObjectNamespace<Counter<Bindings>>;
	JWT_SECRET: string;
	FILE_SERVER: string;
}

const loginErrorHTML = loginHTML.split("<!--ERRORMSG-->")

function loginError(err: string) {
	return loginErrorHTML.join(err)
}

const ipChecker = createChecker(buptSubnets);

export default new Hono<{ Bindings: Bindings }>()
	.get("/login", async c => {
		return c.html(loginHTML)
	})
	.post("/login", async c => {
		const { studentId, password } = await c.req.parseBody()
		if (typeof studentId !== "string" || typeof password !== "string") {
			return c.html(loginError("数据格式错误"))
		}
		try {
			await login(studentId, password)
			const jwt = await sign({
				studentId,
				exp: Date.now() + 2592000
			}, c.env.JWT_SECRET)
			c.header('Set-Cookie', `token=${jwt}; Max-Age=2592000; Secure; HttpOnly; SameSite=Strict`)
			return c.redirect("/")
		} catch (e) {
			return c.html(loginError((e as Error)?.message || e?.toString() || "未知错误"))
		}
	})
	.use(async (c, next) => {
		const ip = c.req.header("CF-Connecting-IP")
		if (ip && ipChecker(ip)) {
			await next()
		} else {
			const jwt = c.req.header("Cookie")?.split(";").find(v => v.startsWith("token="))?.split("=")[1]
			if (!jwt) {
				return c.redirect("/login")
			}
			try {
				await verify(jwt, c.env.JWT_SECRET)
				await next()
			} catch {
				return c.redirect("/login")
			}
		}
	})
	// @ts-ignore
	.get("/files/*", async c => {
		const path = c.req.path.slice(7)
		const url = c.env.FILE_SERVER + (c.env.FILE_SERVER.endsWith("/") ? "" : "/") + path
		return fetch(url)
	})
	.use(serveStatic({
		root: './',
		manifest
	}))
	.use(serveStatic({
		root: './',
		manifest,
		rewriteRequestPath: path => '/index.html'
	}))
