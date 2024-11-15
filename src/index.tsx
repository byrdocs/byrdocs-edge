import { Hono, Context } from 'hono';
import { getSignedCookie, setSignedCookie } from 'hono/cookie'

import { Counter } from './objects/counter';
export { Counter } from './objects/counter';

import { createChecker } from 'is-in-subnet';
import { buptSubnets } from '../bupt';

import { Login } from './pages/login';
import { login } from './login';

import { AwsClient } from 'aws4fetch'
import { Bindings } from './types';

import apiRoute from './api';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from '@prisma/client';
export { OAuth } from './objects/oauth';

const ipChecker = createChecker(buptSubnets);

async function page(c: Context) {
    const url = new URL(c.req.url, "https://byrdocs-frontend.pages.dev/")
    return fetch("https://byrdocs-frontend.pages.dev" + c.req.url.slice(url.origin.length))
}

async function setCookie(c: Context) {
    await setSignedCookie(c, "login", "1", c.env.JWT_SECRET, {
        maxAge: 2592000,
        secure: true,
        httpOnly: true,
        sameSite: "None",
        path: "/"
    })
}

const app = new Hono<{ Bindings: Bindings }>()
    .get("/login", async c => {
        const ip = c.req.header("CF-Connecting-IP") || "未知"
        if (ip !== "未知" && ipChecker(ip)) return c.redirect(c.req.query("to") || "/")
        return c.render(<Login ip={ip} />)
    })
    .get("/github/:uuid", async c => {
        const uuid = c.req.param("uuid")
        const origin = new URL(c.req.url).origin
        return c.redirect("https://github.com/login/oauth/authorize?" + new URLSearchParams({
            client_id: c.env.GITHUB_CLIENT_ID,
            redirect_uri: origin + "/callback",
            state: uuid,
        }))
    })
    .route("/api", apiRoute)
    .post("/login", async c => {
        const ip = c.req.header("CF-Connecting-IP") || "未知"
        if (ip !== "未知" && ipChecker(ip)) return c.redirect(c.req.query("to") || "/")
        const { studentId, password } = await c.req.parseBody()
        if (typeof studentId !== "string" || typeof password !== "string") {
            return c.render(<Login errorMsg="输入不合法" ip={ip} />)
        }
        try {
            if (await login(studentId, password)) {
                await setCookie(c)
                return c.redirect(c.req.query("to") || "/")
            }
            return c.render(<Login errorMsg="可能是用户名或密码错误" ip={ip} />)
        } catch (e) {
            return c.render(<Login errorMsg={(e as Error).message || e?.toString() || "未知错误"} ip={ip} />)
        }
    })
    .get("/rank", async c => {
        const token = c.req.query("token")
        if (token !== c.env.TOKEN) {
            return c.json({ error: "Forbidden" }, { status: 403 })
        }
        const id: DurableObjectId = c.env.COUNTER.idFromName("counter");
        const stub: DurableObjectStub<Counter<Bindings>> = c.env.COUNTER.get(id);
        const data = await stub.list()
        return c.json(data)
    })
    .get("/files/:path{.*?}", async c => {
        const path = c.req.param("path")
        const isFile = !path.endsWith(".jpg") && !path.endsWith(".webp")
        const filename = c.req.query("filename")
        if (isFile) {
            const token = c.req.header("X-Byrdocs-Token")
            const ip = c.req.header("CF-Connecting-IP")
            if ((!ip || !ipChecker(ip)) && token !== c.env.TOKEN && await getSignedCookie(c, c.env.JWT_SECRET, "login") !== "1") {
                const toq = new URL(c.req.url).searchParams
                if ((c.req.path === "" || c.req.path === '/') && toq.size === 0) return c.redirect("/login")
                const to = c.req.path + (toq.size > 0 ? "?" + toq.toString() : "")
                return c.redirect("/login?" + new URLSearchParams({ to }).toString())
            }
            const id: DurableObjectId = c.env.COUNTER.idFromName("counter");
            const stub: DurableObjectStub<Counter<Bindings>> = c.env.COUNTER.get(id);
            c.executionCtx.waitUntil(stub.add(path))
        }
        const aws = new AwsClient({
            accessKeyId: c.env.S3_GET_ACCESS_KEY_ID,
            secretAccessKey: c.env.S3_GET_SECRET_ACCESS_KEY,
            service: "s3",
        })
        const url = `${c.env.S3_HOST}/${c.env.S3_BUCKET}/` + path
        const res = await aws.fetch(url)
        if (filename && res.status === 200) {
            const headers = new Headers(res.headers)
            headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`)
            return new Response(res.body, {
                ...res,
                headers
            })
        }
        return res
    })
    .use(page)

export default {
    fetch: app.fetch,
    async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
        const s3 = new AwsClient({
            accessKeyId: env.S3_ADMIN_ACCESS_KEY_ID,
            secretAccessKey: env.S3_ADMIN_SECRET_ACCESS_KEY,
            service: "s3",
        })

        const prisma = new PrismaClient({ adapter: new PrismaD1(env.DB) })
        const files = await prisma.file.findMany({
            where: {
                OR: [
                    {
                        AND: [
                            { status: { notIn: ['Uploaded', 'Published'] } },
                            { createdAt: { lte: new Date(Date.now() - 3600 * 1000) } }
                        ],
                    },
                    {
                        AND: [
                            { status: 'Uploaded' },
                            { createdAt: { lte: new Date(Date.now() - 14 * 24 * 3600 * 1000) } }
                        ],
                    },
                ],
            },
        });
        for (const file of files) {
            await s3.fetch(`${env.S3_HOST}/${env.S3_BUCKET}/${file.fileName}`, {
                method: "DELETE"
            })
            await prisma.file.update({
                where: {
                    id: file.id
                },
                data: {
                    status: file.status === "Uploaded" ? "Expired" : "Timeout"
                }
            })
        }
    }
}
