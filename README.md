# Free URL shortener API with GET and POST

[shrink.site](https://shrink.site) creates short, shareable links without an account or API key. Use a GET request from a script, AI agent or URL-only tool; use POST for JSON-based applications. Custom aliases, optional expiration, destination lookup and token-authorized deletion are supported.

## Shorten a URL with GET

```sh
curl --get 'https://shrink.site/s' \
  --data-urlencode 'url=https://example.com/a/long/path?source=example'
```

`/s` returns a plain-text short URL with status 201. Save the `X-Delete-Token` response header if you want to revoke it later. Use `/api/links` to receive the URL, destination, identifier and deletion token together as JSON:

```sh
curl --get 'https://shrink.site/api/links' \
  --data-urlencode 'url=https://example.com/a/long/path' \
  --data-urlencode 'expires_in=3600'
```

The JSON response includes `id`, `url`, `destination`, `api_url`, `delete_token`, `created_at` and `expires_at`. The deletion token is only returned at creation. GET requests create a new link on each successful call; they are not idempotent, so avoid blind retries.

## POST, aliases and expiration

```sh
curl 'https://shrink.site/api/links' -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com/a/long/path","alias":"my-example","expires_in":86400}'
```

An alias is optional, case sensitive, and 3–64 characters long using letters, digits, underscores or hyphens. A used or unavailable alias returns 409, including an alias that was previously deleted. Choose your own unique alias instead of copying the example verbatim.

Links never expire by default. Set `expires_in` to a whole number of seconds up to 315,360,000; `0` means no expiry. Destinations must be public HTTP(S) URLs on ports 80 or 443. Encode the whole destination when using GET, including its own query parameters.

## Follow, inspect or delete a link

| Request | Behavior |
| --- | --- |
| `GET /{id}` or `HEAD /{id}` | 302 redirect to the destination |
| `GET /api/links/{id}` | Inspect destination and expiry as JSON without redirecting |
| `POST /api/links/{id}/delete` | JSON body `{"delete_token":"..."}`; success is 204 |
| `DELETE /api/links/{id}` | `Authorization: Bearer DELETE_TOKEN`; success is 204 |

```sh
curl 'https://shrink.site/api/links/LINK_ID'
curl 'https://shrink.site/api/links/LINK_ID/delete' \
  -H 'Content-Type: application/json' -d '{"delete_token":"DELETE_TOKEN"}'
```

Deleted or expired links return 404. Deletion is not supported through GET. Keep deletion tokens private; destination lookup is public and short links are not a secret-storage mechanism.

## Common questions

**Can I use a URL shortener without POST or an API key?** Yes. `/s?url=ENCODED_URL` returns plain text and `/api/links?url=ENCODED_URL` returns JSON, both through GET.

**Can I inspect a short link before opening it?** Yes. Request `/api/links/{id}` to retrieve its destination without following the redirect.

## SDKs and runnable examples

This repository contains dependency-free JavaScript (with TypeScript declarations), Python and Go clients. They are source packages in this repository; no npm or PyPI release is implied. Clone the repository to run the examples:

```sh
git clone https://github.com/skibid991/shrink.site.git
cd shrink.site
```

### JavaScript and TypeScript

Requires Node.js 22+ or a browser with `fetch` and `AbortSignal.timeout`. Run `node examples/javascript/quickstart.mjs` from the repository root. You can also install the local package using `npm install ./sdk/javascript`; TypeScript declarations are included.

```js
import {Shrink} from './sdk/javascript/index.js';
const client = new Shrink();
const link = await client.shorten('https://example.com/a/long/path', {expires_in: 300});
try { console.log(link.url, (await client.get(link.id)).destination); } finally { await client.delete(link.id, link.delete_token); }
```

### Python

Requires Python 3.10+, with no third-party packages. Run `PYTHONPATH=sdk/python python3 examples/python/quickstart.py`. To use the module in another project, copy `sdk/python/shrink.py` into your project or add that directory to your Python path.

```python
from shrink import Shrink

client = Shrink()
link = client.shorten('https://example.com/a/long/path', expires_in=300)
try:
    print(link['url'], client.get(link['id'])['destination'])
finally:
    client.delete(link['id'], link['delete_token'])
```

### Go

Requires Go 1.22+. Run `go -C examples/go run .`. The example module uses the local SDK. From another Go module, run `go get github.com/skibid991/shrink.site/sdk/go` and import that path.

See [the runnable Go example](examples/go/main.go) and [SDK method reference](docs/sdk.md). SDKs use a 45-second client timeout by default. Change it for your workload. Do not automatically retry creation requests: a successful request whose response is lost can still have created a resource.

## API reference and discovery

- [Interactive HTML API reference](https://shrink.site/docs)
- [OpenAPI 3.1 schema](https://shrink.site/openapi.json)
- [Plain-text usage guide](https://shrink.site/llms.txt)

The live API reference is authoritative. Documented GET routes work without an SDK. Encode query parameters with `URLSearchParams`, Python `urlencode`, Go `url.Values`, or cURL `--data-urlencode`.

## Development

Offline tests cover query encoding, Unicode, binary response preservation, request bodies, authorization headers, error handling and redirect behavior:

```sh
node --test sdk/javascript/client.test.mjs
PYTHONPATH=sdk/python python3 -m unittest discover -s sdk/python -p 'test_*.py'
go -C sdk/go test ./...
go -C examples/go build -o /tmp/shrink-example .
```

Examples call the public service. Paste/link quickstarts create temporary resources and delete them after reading. Contributions should focus on public API usage and client behavior. Licensed under [MIT](LICENSE).
