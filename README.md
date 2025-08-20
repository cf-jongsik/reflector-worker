# Reflector Worker

A Cloudflare Worker that reflects incoming HTTP requests back to the client, providing comprehensive information about the request including headers, body, query parameters, and metadata. Perfect for debugging, testing API clients, webhooks, and understanding HTTP request structure.

## Features

- **Complete Request Reflection**: Returns all request details including method, headers, URL, path, query parameters, and body
- **Multiple Content-Type Support**:
  - `application/json`
  - `application/x-www-form-urlencoded`
  - `multipart/form-data`
  - `text/plain`
  - `text/html`
  - `application/xml` / `text/xml`
  - `application/octet-stream` (binary data as base64)
  - Fallback for unsupported content types
- **Robust Error Handling**: Gracefully handles parsing errors and returns detailed error information
- **Performance Metrics**: Includes processing time for each request
- **HTTP Method Awareness**: Properly handles GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Comprehensive Response**: Returns structured JSON with request details, body, errors, and metadata

## Prerequisites

- Node.js 18+ and pnpm
- Cloudflare account
- Wrangler CLI

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd reflector-worker
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure your worker:
   - Update `wrangler.jsonc` with your domain settings
   - Set your Cloudflare account ID and API token (if needed)

## Development

Run the worker locally:

```bash
pnpm dev
```

The worker will be available at `http://localhost:8787`

## Testing

Test with different content types:

### JSON Request

```bash
curl -X POST http://localhost:8787/test \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "value": 123}'
```

### Form Data

```bash
curl -X POST http://localhost:8787/test \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=test&value=123"
```

### Plain Text

```bash
curl -X POST http://localhost:8787/test \
  -H "Content-Type: text/plain" \
  -d "Hello, World!"
```

### Binary Data

```bash
curl -X POST http://localhost:8787/test \
  -H "Content-Type: application/octet-stream" \
  --data-binary @file.bin
```

## Response Format

The worker returns a JSON response with the following structure:

```json
{
	"request": {
		"method": "POST",
		"url": "https://reflector.example.com/test",
		"path": "/test",
		"headers": {
			"content-type": "application/json",
			"user-agent": "curl/7.64.1"
		},
		"query": {
			"param1": "value1"
		},
		"params": {},
		"contentType": "application/json",
		"contentLength": 31
	},
	"body": {
		"name": "test",
		"value": 123
	},
	"error": null,
	"rawBody": null,
	"metadata": {
		"timestamp": "2025-08-21T06:00:00.000Z",
		"processingTimeMs": 5,
		"workerVersion": "1.0.0"
	}
}
```

### Error Response

When an error occurs, the response includes error details:

```json
{
  "request": { ... },
  "body": null,
  "error": "JSON parse error: Unexpected token...",
  "rawBody": "{ invalid json",
  "metadata": { ... }
}
```

## Deployment

Deploy to Cloudflare Workers:

```bash
pnpm deploy
```

## Configuration

The worker configuration is in `wrangler.jsonc`:

```json
{
	"name": "reflector-worker",
	"main": "src/index.ts",
	"compatibility_date": "2025-08-20",
	"workers_dev": false,
	"route": {
		"pattern": "reflector.cloudflareapp.cc",
		"custom_domain": true
	}
}
```

## Use Cases

- **API Development**: Test your API clients by seeing exactly what requests they send
- **Webhook Debugging**: Understand the structure of incoming webhooks
- **HTTP Learning**: Educational tool for understanding HTTP request structure
- **Integration Testing**: Verify that your applications send correct request data
- **Proxy Development**: Use as a starting point for building HTTP proxies or middleware

## Project Structure

```
reflector-worker/
├── src/
│   └── index.ts          # Main worker implementation
├── wrangler.jsonc        # Cloudflare Worker configuration
├── worker-configuration.d.ts  # TypeScript definitions
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
