declare module "*.html" {
	const value: string;
	export default value;
}

declare module "__STATIC_CONTENT_MANIFEST" {
	const value: object | string;
	export default value;
}
