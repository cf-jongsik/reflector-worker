import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.all('*', async (c) => {
	const headers = c.req.header();
	console.log(headers, null, 2);

	if (c.req.method === 'GET' || c.req.method === 'HEAD') {
		return new Response(null, {
			status: 200,
			headers: headers,
		});
	}

	const body = await c.req.arrayBuffer();

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
