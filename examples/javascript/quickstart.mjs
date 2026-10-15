import {Shrink} from '../../sdk/javascript/index.js';
const client = new Shrink();
const link = await client.shorten('https://example.com/a/long/path', {expires_in: 300});
try { console.log(link.url, (await client.get(link.id)).destination); } finally { await client.delete(link.id, link.delete_token); }
