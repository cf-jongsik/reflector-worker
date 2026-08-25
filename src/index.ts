import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

const app = new Hono<{ Bindings: Env }>();

app.use(prettyJSON());

// Constants for content type handling
type ContentTypeHandler = {
	types: string[];
	ext: string;
	parse: (c: any) => Promise<any>;
};

const CONTENT_TYPE_HANDLERS: Record<string, ContentTypeHandler> = {
	json: { types: ['application/json', 'text/json'], ext: 'json', parse: (c: any) => c.req.json() },
	text: { types: ['text/plain', 'text/html'], ext: 'txt', parse: (c: any) => c.req.text() },
	form: { types: ['application/x-www-form-urlencoded', 'multipart/form-data'], ext: 'form', parse: (c: any) => c.req.formData() },
	binary: { types: ['application/octet-stream'], ext: 'bin', parse: (c: any) => c.req.blob() },
};

// Helper to extract and normalize content type
const getContentType = (header: string | undefined): string => {
	return (header ?? 'application/octet-stream').split(';')[0].trim().toLowerCase();
};

// Helper to find handler for content type
const findHandler = (contentType: string) => {
	for (const [, handler] of Object.entries(CONTENT_TYPE_HANDLERS)) {
		if (handler.types.includes(contentType)) {
			return handler;
		}
	}
	return CONTENT_TYPE_HANDLERS.binary;
};

// Helper to format form data
const formatFormData = (formData: FormData): Record<string, string> => {
	const result: Record<string, string> = {};
	formData.forEach((value, key) => {
		result[key] = String(value);
	});
	return result;
};

// Helper to safely read request body
const readRequestBody = async (c: any, handler: ContentTypeHandler): Promise<any> => {
	try {
		if (handler.ext === 'json') {
			const json = await c.req.json();
			if (!json) {
				return {};
			}
			console.debug('JSON body:', json);
			return json;
		} else if (handler.ext === 'txt') {
			const text = await c.req.text();
			console.debug('Text body:', text);
			return text;
		} else if (handler.ext === 'form') {
			// For form data, we need to use the original request
			return c.req.formData();
		} else {
			// For binary, get as blob
			const blob = await c.req.blob();
			if (blob.size === 0) {
				return new Blob();
			}
			return blob;
		}
	} catch (error) {
		throw error;
	}
};

// Helper to create error response
const createErrorResponse = (message: string, status: number, path?: string, method?: string) => ({
	error: {
		message,
		...(path && { path }),
		...(method && { method }),
	},
	metadata: {
		timestamp: new Date().toISOString(),
	},
});

app.get('/httpbin/:path?', async (c) => {
	const { HTTPBIN } = c.env;
	if (!HTTPBIN) {
		return c.json(createErrorResponse('VPC not available', 500, c.req.path, c.req.method), 500);
	}

	const path = c.req.param('path') ?? '';
	const url = new URL(`http://127.0.0.1/${path}`);
	console.debug({ mode: 'VPC', service: 'HTTPBIN', url: url.toString() });

	return HTTPBIN.fetch(new Request(url), c.req.raw);
});

app.all('*', async (c) => {
	const headers = c.req.header();

	// Early return for GET/HEAD requests
	if (c.req.method === 'GET' || c.req.method === 'HEAD') {
		return c.json(headers, { status: 200, headers });
	}

	const { R2 } = c.env;
	if (!R2) {
		return c.json(createErrorResponse('R2 bucket not available', 500), 500);
	}

	const fileName = Date.now().toString();
	const contentType = getContentType(c.req.header('content-type'));
	const handler = findHandler(contentType);

	try {
		// Parse request body
		let body: any;
		try {
			body = await readRequestBody(c, handler);
		} catch (parseError) {
			console.error('Parse error:', parseError);
			return c.json(
				createErrorResponse(
					`Failed to parse ${handler.ext} body: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
					400,
					c.req.path,
					c.req.method,
				),
				400,
			);
		}

		// Handle empty body case
		if (body instanceof Blob && body.size === 0) {
			return c.json({ headers }, 200);
		}

		// Prepare content for storage
		let content: any;
		let storageContentType = contentType;

		if (handler.ext === 'json') {
			content = JSON.stringify(body);
		} else if (handler.ext === 'txt') {
			content = body;
		} else if (handler.ext === 'form') {
			content = JSON.stringify(formatFormData(body));
			storageContentType = 'text/plain';
		} else {
			content = body;
		}

		// Store in R2
		const r2Result = await R2.put(`trace/${fileName}.${handler.ext}`, content, {
			httpMetadata: { contentType: storageContentType },
		});

		if (!r2Result) {
			return c.json(createErrorResponse('Failed to store request body', 500), 500);
		}

		// Return success response
		return c.json(
			{
				r2Result: {
					key: r2Result.key,
					size: r2Result.size,
					etag: r2Result.etag,
				},
				headers,
			},
			{
				status: 200,
				headers: {
					...headers,
					'x-filename': fileName,
					'x-size': r2Result.size.toString(),
					'x-etag': r2Result.etag,
				},
			},
		);
	} catch (error) {
		console.error('Error processing request:', error);
		return c.json(
			createErrorResponse(error instanceof Error ? error.message : 'Failed to process request', 400, c.req.path, c.req.method),
			400,
		);
	}
});

app.onError((err, c) => {
	console.error('Application error:', err);
	return c.json(
		{
			error: {
				message: err.message || 'Internal Server Error',
				type: err.name || 'Error',
			},
			metadata: {
				timestamp: new Date().toISOString(),
				path: c.req.path,
				method: c.req.method,
			},
		},
		500,
	);
});

app.notFound((c) => {
	return c.json(createErrorResponse('Not Found', 404, c.req.path, c.req.method), 404);
});

export default app;
