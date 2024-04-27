import { DurableObject } from "cloudflare:workers";

export class Counter<T> extends DurableObject {

	constructor(ctx: DurableObjectState, env: T) {
		super(ctx, env);
	}

	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}
}
