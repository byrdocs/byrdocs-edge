# byrdocs-edge

BYR Docs 的边缘服务，部署在 Cloudflare Workers 上。

## 功能

- 提供前端页面；
- 验证北邮学生身份；
    - 如果来源 IP 属于北邮教育网出口（见 [bupt.ts](bupt.ts)），则通过验证；
    - 否则，模拟登录 [北邮统一认证](https://auth.bupt.edu.cn/authserver/login) 验证身份。
- 统计文件下载次数；
- GitHub OAuth 登录；
- 反代资源文件。

