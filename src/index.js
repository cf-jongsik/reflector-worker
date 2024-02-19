import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
	console.log(c.req.header());
	return c.json({ header: c.req.header(), body: c.req.body });
});

app.post('/', async (c) => {
	console.log(c.req.header());
	console.log(await c.req.json());
	return c.json({ header: c.req.header(), body: await c.req.json() });
});

app.put('/', async (c) => {
	console.log(c.req.header());
	console.log(await c.req.json());
	return c.json({ header: c.req.header(), body: await c.req.json() });
});

export default app;
