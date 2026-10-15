from shrink import Shrink

client = Shrink()
link = client.shorten('https://example.com/a/long/path', expires_in=300)
try:
    print(link['url'], client.get(link['id'])['destination'])
finally:
    client.delete(link['id'], link['delete_token'])
