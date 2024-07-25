# API

## `curl` (async)

With `curl`, you can interact with network resources directly.

```ts
async function curl(url: string, args: CurlArgs) => CurlResponse

type CurlArgs = {
    method?: "GET" | "POST" | "DELETE" | "HEAD",
    headers?: object,
    data?: string, // ignored if `json` exists
    json?: JSON,
}

type CurlResponse = {
    status: number,
    data: string,
}
```

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
