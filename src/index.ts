import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
	const startTime = Date.now();

	// Collect comprehensive request information
	const headers = c.req.header();
	const method = c.req.method;
	const url = c.req.url;
	const path = c.req.path;
	const query = c.req.query();
	const params = c.req.param();

	// Parse content-type more carefully
	const contentType = c.req.header('content-type') || '';
	const contentLength = c.req.header('content-length');

	let body: any = null;
	let bodyError: string | null = null;
	let rawBody: string | null = null;

	console.log(`[${method}] ${path}`, JSON.stringify({ headers, query, params }, null, 2));

	// Handle different content types with proper error handling
	try {
		if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
			// These methods typically don't have a body
			body = null;
		} else if (!contentType || contentLength === '0') {
			// No content-type or empty body
			body = null;
		} else if (contentType.includes('application/json')) {
			try {
				body = await c.req.json();
				console.log('Parsed JSON:', JSON.stringify(body, null, 2));
			} catch (jsonError) {
				bodyError = `JSON parse error: ${jsonError}`;
				rawBody = await c.req.text();
				console.error('JSON parse failed:', jsonError, 'Raw body:', rawBody);
			}
		} else if (contentType.includes('multipart/form-data')) {
			try {
				body = await c.req.parseBody();
				console.log('Parsed multipart form-data:', body);
			} catch (formError) {
				bodyError = `Form-data parse error: ${formError}`;
				rawBody = await c.req.text();
				console.error('Form-data parse failed:', formError);
			}
		} else if (contentType.includes('application/x-www-form-urlencoded')) {
			try {
				body = await c.req.parseBody();
				console.log('Parsed URL-encoded form:', body);
			} catch (urlEncodedError) {
				bodyError = `URL-encoded parse error: ${urlEncodedError}`;
				rawBody = await c.req.text();
				console.error('URL-encoded parse failed:', urlEncodedError);
			}
		} else if (contentType.includes('text/plain')) {
			try {
				body = await c.req.text();
				console.log('Plain text body:', body);
			} catch (textError) {
				bodyError = `Text parse error: ${textError}`;
				console.error('Text parse failed:', textError);
			}
		} else if (contentType.includes('text/html')) {
			try {
				body = await c.req.text();
				console.log('HTML body received');
			} catch (htmlError) {
				bodyError = `HTML parse error: ${htmlError}`;
				console.error('HTML parse failed:', htmlError);
			}
		} else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
			try {
				body = await c.req.text();
				console.log('XML body received');
			} catch (xmlError) {
				bodyError = `XML parse error: ${xmlError}`;
				console.error('XML parse failed:', xmlError);
			}
		} else if (contentType.includes('application/octet-stream')) {
			try {
				const arrayBuffer = await c.req.arrayBuffer();
				// Convert to base64 for JSON response
				body = {
					type: 'binary',
					size: arrayBuffer.byteLength,
					base64: btoa(String.fromCharCode(...new Uint8Array(arrayBuffer))),
				};
				console.log('Binary data received, size:', arrayBuffer.byteLength);
			} catch (binaryError) {
				bodyError = `Binary parse error: ${binaryError}`;
				console.error('Binary parse failed:', binaryError);
			}
		} else {
			// Unknown content-type, try to get raw text
			try {
				rawBody = await c.req.text();
				body = {
					type: 'unsupported',
					contentType: contentType,
					raw: rawBody,
				};
				console.log('Unsupported content-type:', contentType);
			} catch (rawError) {
				bodyError = `Failed to read body: ${rawError}`;
				console.error('Failed to read raw body:', rawError);
			}
		}
	} catch (generalError) {
		bodyError = `General body parsing error: ${generalError}`;
		console.error('Unexpected error during body parsing:', generalError);
	}

	const processingTime = Date.now() - startTime;

	// Build comprehensive response
	const response = {
		request: {
			method,
			url,
			path,
			headers: headers || {},
			query: query || {},
			params: params || {},
			contentType: contentType || null,
			contentLength: contentLength ? parseInt(contentLength) : null,
		},
		body: body,
		error: bodyError,
		rawBody: bodyError ? rawBody : null,
		metadata: {
			timestamp: new Date().toISOString(),
			processingTimeMs: processingTime,
			workerVersion: '1.0.0',
		},
	};

	return c.json(response, 200);
});

app.onError((err, c) => {
	console.error('Application error:', err);
	return c.json(
		{
			error: {
				message: err.message || 'Internal Server Error',
				type: err.name || 'Error',
				stack: err.stack,
			},
			metadata: {
				timestamp: new Date().toISOString(),
				path: c.req.path,
				method: c.req.method,
			},
		},
		500
	);
});

app.notFound((c) => {
	return c.json(
		{
			error: {
				message: 'Not Found',
				path: c.req.path,
				method: c.req.method,
			},
			metadata: {
				timestamp: new Date().toISOString(),
			},
		},
		404
	);
});

export default app;
