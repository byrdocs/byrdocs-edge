import type { FC, PropsWithChildren } from 'hono/jsx'
import { html } from 'hono/html'

const Layout: FC = ({ children }: PropsWithChildren<{}>) => {
    return (
        <html lang='zh-CN'>
            <head>
                <title>BYR Docs</title>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="icon" href="/logo_512.png" type='image/png' />
                <meta name="description" content="北京邮电大学资料分享平台，旨在使校内学生更方便地获取与北邮课程有关的教育资源，包括电子书籍、考试题目和复习资料等。" />
                <meta name="keywords" content="北邮, 北京邮电大学, 资料, 电子书籍, 考试题目, 复习资料" />
                <meta name="author" content="BYR Docs" />
                <meta property="og:image" content="/logo_512.png" />
                <meta property="og:image:width" content="512" />
                <meta property="og:image:height" content="512" />
                <meta property="og:title" content="BYR Docs" />
                <meta property="og:description" content="北京邮电大学资料分享平台，旨在使校内学生更方便地获取与北邮课程有关的教育资源，包括电子书籍、考试题目和复习资料等。" />
                <meta property="og:type" content="website" />
            </head>
            <body>
                {children}
            </body>
        </html>
    )
}

function Link({ to, children, className }: PropsWithChildren<{ to: string, className?: string }>) {
    return (
        <a href={to} target="_blank"
            className={"text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300 " + (className || '')}>{children}</a>
    )
}

export const Notification: FC<{ message?: string }> = ({ message: errorMsg}) => {
    return (
        <Layout current={'login'}>
            <div className="min-h-[100vh] flex flex-col dark:bg-black">
                <div className={"md:rounded-lg border bg-card text-card-foreground shadow-sm w-full md:w-[500px] m-auto p-4 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 "} id="loginCard">
                    <div className="flex flex-col justify-center items-center p-6 space-y-1">
                        {errorMsg && <p className="text-xl text-center leading-10">{errorMsg}</p>}
                    </div>
                </div>
                <footer className="h-12 text-center text-xs sm:text-sm flex text-gray-500 dark:text-gray-400 px-4">
                    <p className="m-auto text-xs px-5 group">
                        <Link to="mailto:contact@byrdocs.org" className=''>
                            联系我们
                        </Link>
                        <span className="mx-2">|</span>
                        <Link to="https://github.com/orgs/byrdocs/discussions">
                            GitHub Discussions
                        </Link>
                        <span className="mx-2">|</span>
                        <Link to="https://qm.qq.com/q/sxv5SAKP0A">
                            QQ 群
                        </Link>
                    </p>
                </footer>
            </div>

        </Layout>
    )
}
