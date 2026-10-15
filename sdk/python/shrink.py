"""Dependency-free shrink.site client. Requires Python 3.10+."""
import json
from dataclasses import dataclass
from urllib.error import HTTPError
from urllib.parse import urlencode, quote, urlsplit, urlunsplit, parse_qsl
from urllib.request import Request, HTTPRedirectHandler, build_opener

class APIError(Exception):
    def __init__(self, response):
        self.status = response.status
        self.body = response.body
        super().__init__(f"HTTP {self.status}: {response.text()[:500]}")

@dataclass
class Response:
    status: int
    headers: object
    body: bytes
    def text(self):
        return self.body.decode('utf-8', errors='replace')
    def json(self):
        return json.loads(self.body)

class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

class Shrink:
    def __init__(self, base_url='https://shrink.site', timeout=45):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self._opener = build_opener(_NoRedirect())
        self._opener.addheaders = [('User-Agent', 'shrink.site-sdk/0.1.0 (+https://shrink.site)')]

    def url(self, path, query=None):
        if not path.startswith('/') or path.startswith('//'):
            raise ValueError('Use an API path beginning with one slash.')
        values = {}
        for key, value in (query or {}).items():
            if value is not None:
                values[key] = json.dumps(value, separators=(',', ':')) if isinstance(value, (dict, list, bool)) else str(value)
        parts = urlsplit(self.base_url + path)
        merged = dict(parse_qsl(parts.query, keep_blank_values=True))
        merged.update(values)
        return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(merged), parts.fragment))

    def request(self, path, *, query=None, method='GET', body=None, headers=None, check=True):
        """Buffer a response, preserving bytes. Redirects are not followed."""
        headers = dict(headers or {})
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode('utf-8')
            if not any(k.lower() == 'content-type' for k in headers):
                headers['Content-Type'] = 'application/json'
        elif isinstance(body, str):
            body = body.encode('utf-8')
        req = Request(self.url(path, query), data=body, headers=headers, method=method)
        try:
            handle = self._opener.open(req, timeout=self.timeout)
        except HTTPError as error:
            handle = error
        with handle:
            response = Response(handle.code, handle.headers, handle.read())
        if check and not 200 <= response.status < 300:
            raise APIError(response)
        return response
    def shorten(self, url, *, method='GET', **options):
        data = {**options, 'url': url, 'format': 'json'}
        return self.request('/api/links', **({'query': data} if method == 'GET' else {'method': method, 'body': data})).json()

    def get(self, id):
        return self.request('/api/links/' + quote(id, safe='')).json()

    def delete(self, id, delete_token):
        self.request('/api/links/' + quote(id, safe='') + '/delete', method='POST', body={'delete_token': delete_token})
