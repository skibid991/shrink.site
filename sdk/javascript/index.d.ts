export interface Link {id: string; url: string; destination: string; created_at: string; expires_at: string | null}
export interface CreatedLink extends Link {api_url: string; delete_token: string}
export interface RequestOptions {query?: Record<string, unknown>; method?: string; body?: BodyInit | Record<string, unknown>; headers?: HeadersInit; check?: boolean; redirect?: RequestRedirect}
export class APIError extends Error {status: number; body: string}
export class Shrink {
  constructor(options?: {baseUrl?: string; timeout?: number; fetch?: typeof globalThis.fetch});
  url(path: string, query?: Record<string, unknown>): string;
  request(path: string, options?: RequestOptions): Promise<Response>;
  shorten(url: string, options?: {alias?: string; expires_in?: number; method?: 'GET' | 'POST'}): Promise<CreatedLink>;
  get(id: string): Promise<Link>;
  delete(id: string, deleteToken: string): Promise<void>;
}
