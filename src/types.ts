import { Counter } from "./counter";
import { OAuth } from "./oauth";

export type Bindings = {
    COUNTER: DurableObjectNamespace<Counter<Bindings>>;
    OAUTH: DurableObjectNamespace<OAuth>;
    JWT_SECRET: string;
    FILE_SERVER: string;
    TOKEN: string;
    S3_GET_ACCESS_KEY_ID: string;
    S3_GET_SECRET_ACCESS_KEY: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
}
