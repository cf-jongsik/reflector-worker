import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.all('*', async (c) => {
	// Get the original request
	const request = c.req.raw;

	// Clone the request to read the body
	const clonedRequest = request.clone();

	// Get headers from original request
	const headers = c.req.header();

	// For GET/HEAD requests with no body, return empty response with same headers
	if (request.method === 'GET' || request.method === 'HEAD') {
		return new Response(null, {
			status: 200,
			headers: headers,
		});
	}

	// Get the body as ArrayBuffer to preserve binary data
	const body = await clonedRequest.arrayBuffer();

	// Return the exact same body with original content type
	return new Response(body, {
		status: 200,
		headers: headers,
	});
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
