# API

## `curl` (async)

With `curl`, you can interact with network resources directly.

```ts
async function curl(url: string, args: CurlArgs) => CurlResponse

type CurlArgs = {
    method?: "GET" | "POST" | "DELETE" | "HEAD" | "OPTIONS" | "PUT" | "PATCH",
    headers?: object,
    data?: string,    // ignored if `json` exists
    json?: JSON,
    binary?: bool,
    timeout?: uint64  // milliseconds
}

type CurlResponse = {
    status: number,
    data: string,
}
```

- If `args.binary` is `true`, then `response.data` will be a base64-encoded representation of the original data.

**Example** POST w/ JSON:

```js
# Basic usage
curl("https://httpbin.org/post", {
    json: {arr: [1,2,3]}
}).then(r => { 
    console.log(r.status, r.status==200)
    return JSON.parse(r.data)
}).then(j => console.log(j.data))

# OpenAI
curl("https://api.openai.com/v1/chat/completions", {
    headers: { "Authorization": "Bearer $OPENAI_API_KEY" },
    json: {
        "model": "gpt-4o-mini",
        "messages": [{
            "role": "system",
            "content": "You are a poetic assistant, skilled in explaining complex programming concepts with creative flair."
        }, {
            "role": "user",
            "content": "Compose a poem that explains the concept of recursion in programming."
        }]
    }
}).then(r => JSON.parse(r.data))
  .then(j => console.log(j))
```
