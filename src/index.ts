import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.post('/v1/traces', async (c) => {
	const { R2 } = c.env;
	const fileName = new Date().toISOString();
	const result = await R2.put(`trace/${fileName}.log.gz`, c.req.raw.body);
	if (result) {
		return c.json({ success: true, etag: result?.etag, key: result?.key, size: result?.size }, { status: 200 });
	} else {
		return c.json({ success: false }, { status: 400 });
	}
});

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
