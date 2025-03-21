import { Hono } from 'hono';

const app = new Hono();

app.use('*', async (c, next) => {
	const header = c.req.header();
	console.log(JSON.stringify(header, null, 2));
	const contentType = c.req.header('content-type');
	let body;

	if (contentType) {
		if (contentType == 'application/json') {
			body = await c.req.json();
			console.log('json', JSON.stringify(body));
		} else if (contentType.includes('form-data')) {
			body = await c.req.parseBody();
			console.log('form', body);
		} else if (contentType.includes('application/x-www-form-urlencoded')) {
			body = await c.req.parseBody();
			console.log('xxx-form', body);
		} else {
			body = 'content-type not supported';
			console.log(body);
		}
	} else {
		body = 'content-type not supported';
		console.log(body);
	}
	return Response.json({ header, body }, { status: 200 });
});

app.onError((err, c) => {
	console.error(err);
	return c.text('Internal Server Error', 500);
});

app.notFound((c) => {
	return c.text('Not Found', 404);
});

export default app;
