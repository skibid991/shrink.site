/** A dependency-free HTTP client for shrink.site. */
export class APIError extends Error {
  constructor(response, body) {
    super(`HTTP ${response.status}: ${body.slice(0, 500)}`);
    this.name = 'APIError'; this.status = response.status; this.body = body;
  }
}
export class Shrink {
  constructor({baseUrl = 'https://shrink.site', timeout = 45000, fetch: fetchImpl = globalThis.fetch} = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); this.timeout = timeout; this.fetch = fetchImpl;
  }
  url(path, query = {}) {
    if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Use an API path beginning with one slash.');
    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
    return url.toString();
  }
  /** Returns a standard Response. Set check=false to inspect non-2xx responses. */
  async request(path, {query = {}, method = 'GET', body, headers = {}, check = true, redirect = 'manual'} = {}) {
    const h = new Headers(headers);
    if (body !== undefined && body !== null && typeof body === 'object' && !(body instanceof Uint8Array) && !(body instanceof ArrayBuffer) && !(body instanceof Blob) && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
      body = JSON.stringify(body); if (!h.has('content-type')) h.set('content-type', 'application/json');
    }
    const response = await this.fetch(this.url(path, query), {method, body, headers: h, redirect, signal: AbortSignal.timeout(this.timeout)});
    if (check && !response.ok) throw new APIError(response, await response.text());
    return response;
  }
  async shorten(url, {method = 'GET', ...options} = {}) {
    const data = {...options, url, format: 'json'}; return (await this.request('/api/links', method === 'GET' ? {query: data} : {method, body: data})).json();
  }
  async get(id) { return (await this.request('/api/links/' + encodeURIComponent(id))).json(); }
  async delete(id, deleteToken) { await this.request('/api/links/' + encodeURIComponent(id) + '/delete', {method: 'POST', body: {delete_token: deleteToken}}); }
}
