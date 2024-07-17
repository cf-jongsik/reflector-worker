import { Hono } from 'hono';

const app = new Hono();

app.get('/*', async (c) => {
	console.log(c.req.header());
	return c.json({ header: c.req.header(), body: c.req.body });
});

app.post('/*', async (c) => {
	const header = c.req.header();
	console.log(header);

	const type = c.req.header('content-type');

	if (type) {
		if (type == 'application/json') {
			const json = await c.req.json();
			console.log(json);
			return new Response(JSON.stringify(json), { headers: header });
		}
		if (type.includes('form-data')) {
			const form = await c.req.parseBody();
			console.log(form);
			return new Response(JSON.stringify(form), { headers: header });
		}
		if (type.includes('application/x-www-form-urlencoded')) {
			const body = await c.req.parseBody();
			console.log(body);
			return new Response(JSON.stringify(body), { headers: header });
		}
	}
	const blob = await c.req.blob();
	console.log(blob);
	return new Response(blob, { headers: header });
});

app.delete('/*', async (c) => {
	const header = c.req.header();
	console.log(header);
	return new Response(c.req.url);
});

app.patch('/*', async (c) => {
	const header = c.req.header();
	console.log(header);

	const type = c.req.header('content-type');

	if (type) {
		if (type == 'application/json') {
			const json = await c.req.json();
			console.log(json);
			return new Response(JSON.stringify(json), { headers: header });
		}
		if (type.includes('form-data')) {
			const form = await c.req.parseBody();
			console.log(form);
			return new Response(JSON.stringify(form), { headers: header });
		}
		if (type.includes('application/x-www-form-urlencoded')) {
			const body = await c.req.parseBody();
			console.log(body);
			return new Response(JSON.stringify(body), { headers: header });
		}
	}
	const blob = await c.req.blob();
	console.log(blob);
	return new Response(blob, { headers: header });
});

app.put('/*', async (c) => {
	const header = c.req.header();
	console.log(header);

	const type = c.req.header('content-type');

	if (type) {
		if (type == 'application/json') {
			const json = await c.req.json();
			console.log(json);
			return new Response(JSON.stringify(json), { headers: header });
		}
		if (type.includes('form-data')) {
			const form = await c.req.parseBody();
			console.log(form);
			return new Response(JSON.stringify(form), { headers: header });
		}
		if (type.includes('application/x-www-form-urlencoded')) {
			const body = await c.req.parseBody();
			console.log(body);
			return new Response(JSON.stringify(body), { headers: header });
		}
	}
	const blob = await c.req.blob();
	console.log(blob);
	return new Response(blob, { headers: header });
});

export default app;
