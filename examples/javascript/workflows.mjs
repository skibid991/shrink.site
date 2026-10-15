import {Shrink} from '../../sdk/javascript/index.js';
const client = new Shrink();
const link = await client.shorten('https://example.com/a/long/path', {method: 'POST', expires_in: 300});
try { console.log(await client.get(link.id)); } finally { await client.delete(link.id, link.delete_token); }
