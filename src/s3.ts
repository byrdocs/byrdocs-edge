import { Hono } from 'hono'
import { Bindings } from './types'
import { verify } from 'hono/jwt'
import { AwsClient } from 'aws4fetch'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { XMLParser } from 'fast-xml-parser'

export default new Hono<{
    Bindings: Bindings,
    Variables: {
        id: number
    }
}>()
    .use(async (c, next) => {
        const auth = c.req.header("Authorization")
        const token = auth?.split("Bearer ")?.[1]
        if (!token) {
            return c.json({ error: "缺少 Token", success: false })
        }
        try {
            const payload = await verify(token, c.env.JWT_SECRET)
            if (typeof payload.id !== "number") {
                return c.json({ error: "Token 无效", success: false })
            }
            c.set("id", payload.id)
        } catch (e) {
            return c.json({ error: "Token 无效", success: false })
        }
        await next()
    })
    .post("/upload", zValidator(
        'json',
        z.object({
            key: z.string(),
        })
    ), async c => {
        const { key } = await c.req.valid("json")

        if (!/^[0-9a-f]{32}\.(zip|pdf)$/.test(key)) {
            return c.json({ error: "文件名不合法", success: false })
        }

        const aws = new AwsClient({
            accessKeyId: c.env.S3_ADMIN_ACCESS_KEY_ID,
            secretAccessKey: c.env.S3_ADMIN_SECRET_ACCESS_KEY,
            service: "s3",
        })
        const file = await aws.fetch(`${c.env.S3_HOST}/${c.env.S3_BUCKET}/` + key + "?cache=false", {
            method: "HEAD"
        })
        if (file.status === 200) {
            return c.json({ error: "文件已存在", success: false })
        } else if (file.status !== 404) {
            return c.json({ error: "文件预检失败, status=" + file.status.toString(), success: false })
        }

        const sts = new AwsClient({
            accessKeyId: c.env.S3_ADMIN_ACCESS_KEY_ID,
            secretAccessKey: c.env.S3_ADMIN_SECRET_ACCESS_KEY,
            service: "sts",
        })
        const token = await sts.fetch(c.env.S3_HOST, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                Action: "AssumeRole",
                DurationSeconds: "900",
                Version: "2011-06-15",
                Policy: JSON.stringify({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": "s3:PutObject",
                        "Resource": `arn:aws:s3:::${c.env.S3_BUCKET}/${key}`,
                        "Condition": {
                            "StringEquals": {
                                "s3:RequestObjectTag/status": "temp",
                                "s3:RequestObjectTag/uploader": c.get("id").toString(),
                            },
                        },
                        "NumericLessThanEquals": {
                            "s3:ContentLength": 2147483648, // 2GB
                        },
                    }]
                })
            }).toString()
        })
        if (!token.ok) {
            return c.json({ error: "获取临时凭证失败", success: false })
        }
        const parser = new XMLParser()
        const data = parser.parse(await token.text()) as {
            AssumeRoleResponse: {
                AssumeRoleResult: {
                    Credentials: {
                        AccessKeyId: string,
                        SecretAccessKey: string,
                        SessionToken: string,
                    }
                }
            }
        }
        return c.json({
            success: true,
            key: key,
            tags: {
                status: "temp",
                uploader: c.get("id").toString(),
            },
            credentials: {
                access_key_id: data.AssumeRoleResponse.AssumeRoleResult.Credentials.AccessKeyId,
                secret_access_key: data.AssumeRoleResponse.AssumeRoleResult.Credentials.SecretAccessKey,
                session_token: data.AssumeRoleResponse.AssumeRoleResult.Credentials.SessionToken
            }
        })
    })
