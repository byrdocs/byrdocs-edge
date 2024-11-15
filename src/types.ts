import { Counter } from "./objects/counter";
import { OAuth } from "./objects/oauth";

export type Bindings = {
    COUNTER: DurableObjectNamespace<Counter<Bindings>>;
    OAUTH: DurableObjectNamespace<OAuth>;
    JWT_SECRET: string;
    TOKEN: string;
    S3_HOST: string;
    S3_BUCKET: string;
    S3_GET_ACCESS_KEY_ID: string;
    S3_GET_SECRET_ACCESS_KEY: string;
    S3_ADMIN_ACCESS_KEY_ID: string;
    S3_ADMIN_SECRET_ACCESS_KEY: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    DB: D1Database;
}
