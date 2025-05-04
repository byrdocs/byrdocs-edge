import { Hono, Context } from 'hono';
import { getSignedCookie, setSignedCookie } from 'hono/cookie'

import { Counter } from './objects/counter';
export { Counter } from './objects/counter';

import { createChecker } from 'is-in-subnet';
import { buptSubnets } from '../bupt';

import { Login } from './pages/login';
import { byrdocs_login } from '@byrdocs/bupt-auth';

import { AwsClient } from 'aws4fetch'
import { Bindings } from './types';

import apiRoute from './api';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from '@prisma/client';
import { sign } from './utils';
export { OAuth } from './objects/oauth';

const ipChecker = createChecker(buptSubnets);

async function page(c: Context) {
    const url = new URL(c.req.url, "https://byrdocs-frontend.pages.dev/")
    const shouldCache = url.pathname.startsWith("/assets") && (url.pathname.endsWith(".js") || url.pathname.endsWith(".css"))
        || url.pathname.startsWith("/pdf-viewer")
    const res = fetch("https://byrdocs-frontend.pages.dev" + c.req.url.slice(url.origin.length), {
        headers: Object.fromEntries(
            Array.from(c.req.raw.headers.entries()).filter(([key, _]) => key.toLowerCase() !== 'cf-connecting-ip')
        )
    })
    if (shouldCache) {
        const cacheRes = await res;
        return new Response(cacheRes.body, {
            status: cacheRes.status,
            statusText: cacheRes.statusText,
            cf: cacheRes.cf,
            webSocket: cacheRes.webSocket,
            headers: {
                ...Object.fromEntries(cacheRes.headers.entries()),
                "cache-control": "public, max-age=10800, s-maxage=10800"
            }
        })
    }
    return res
}

export async function setCookie(c: Context) {
    await setSignedCookie(c, "login", Date.now().toString(), c.env.JWT_SECRET, {
        maxAge: 2592000,
        secure: true,
        sameSite: "None",
        path: "/"
    })
}

const app = new Hono<{ Bindings: Bindings }>()
    .get('/ping', c => c.text('pong'))
    .get("/login", async c => {
        const ip = c.req.header("CF-Connecting-IP") || "未知"
        if (ip !== "未知" && ipChecker(ip)) return c.redirect(c.req.query("to") || "/")
        return c.render(<Login ip={ip} />)
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
            if (await byrdocs_login(studentId, password, c.env.OCR_TOKEN)) {
                await setCookie(c)
                return c.redirect(c.req.query("to") || "/")
            }
            return c.render(<Login errorMsg="可能是用户名或密码错误" ip={ip} />)
        } catch (e) {
            return c.render(<Login errorMsg={(e as Error).message || e?.toString() || "未知错误"} ip={ip} />)
        }
    })
    .get("/schema/:path{.*?}", c => fetch("https://files.byrdocs.org/" + c.req.param("path")))
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
            const cookie = await getSignedCookie(c, c.env.JWT_SECRET, "login")
            if (
                (!ip || !ipChecker(ip)) &&
                token !== c.env.TOKEN &&
                (!cookie || isNaN(parseInt(cookie)) || Date.now() - parseInt(cookie) > 2592000 * 1000)
            ) {
                const toq = new URL(c.req.url).searchParams
                if ((c.req.path === "" || c.req.path === '/') && toq.size === 0) return c.redirect("/login")
                const to = c.req.path + (toq.size > 0 ? "?" + toq.toString() : "")
                return c.redirect("/login?" + new URLSearchParams({ to }).toString())
            }
            const range = c.req.header("Range")
            if (!range || range.startsWith("bytes=0-")) {
                const id: DurableObjectId = c.env.COUNTER.idFromName("counter");
                const stub: DurableObjectStub<Counter<Bindings>> = c.env.COUNTER.get(id);
                c.executionCtx.waitUntil(stub.add(path))
            }
        }
        const req = await sign(c.env, path, c.req.raw.headers)
        const res = await fetch(req)
        if (filename && res.status === 200) {
            const headers = new Headers(res.headers)
            headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`)
            return new Response(res.body, {
                status: res.status,
                statusText: res.statusText,
                webSocket: res.webSocket,
                cf: res.cf,
                headers
            })
        }
        return res
    })
    .get("/thumbnail/:path{.*?}", async c => {
        const path = c.req.param("path")
        const key = `thumbnail/${path}`
        const cached = await c.env.R2.get(key)
        if (cached) {
            return new Response(cached.body, {
                headers: {
                    "Content-Type": cached.httpMetadata?.contentType || "image/jpeg",
                    "Cache-Control": "public, max-age=86400, s-maxage=86400"
                }
            })
        }
        const response = await fetch(c.req.url.replace("/thumbnail/", "/files/"), {
            cf: {
                image: {
                    format: "jpeg",
                    height: 384,
                    quality: 50,
                    fit: "scale-down"
                }
            }
        })
        if (response.ok || response.status === 304) {
            await c.env.R2.put(key, response.clone().body)
            return response
        } else {
            console.log("Thumbnail error:", response.status, response.statusText)
            console.log(await response.text())
            const webp_path = path.replace(/\.\w+$/, ".webp")
            const webp_req = await sign(c.env, webp_path, c.req.raw.headers)
            return fetch(webp_req)
        }
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
            console.log('DELETE', file.fileName, "Reason:", file.status === "Uploaded" ? "Expired" : "Timeout")
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
