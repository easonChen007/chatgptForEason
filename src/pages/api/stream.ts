import type { APIRoute } from "astro"
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser"

const localEnv = import.meta.env.OPENAI_API_KEY
const vercelEnv = process.env.OPENAI_API_KEY
const https_proxy = import.meta.env.HTTPS_PROXY

const apiKeys = ((localEnv || vercelEnv)?.split(/\s*\|\s*/) ?? []).filter(Boolean)

export const post: APIRoute = async context => {
  const body = await context.request.json()
  const apiKey = apiKeys.length ? apiKeys[Math.floor(Math.random() * apiKeys.length)] : ""
  let { messages, key = apiKey, temperature = 0.6 } = body

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  if (!key.startsWith("sk-")) key = apiKey
  if (!key) {
    return new Response("没有填写 OpenAI API key")
  }
  if (!messages) {
    return new Response("没有输入任何文字")
  }

  const RequestInit: {
    headers: {
      "Content-Type": string
      Authorization: string
    }
    method: string
    body: string
    dispatcher?: any
  } = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages,
      temperature,
      stream: true,
    }),
  }

  if (https_proxy) {
    if (process.env.NODE_ENV === "dev") {
      import('undici').then(({ fetch, ProxyAgent }) => {
        RequestInit['dispatcher'] = new ProxyAgent(https_proxy)
      })
    }
  }

  const completion = await fetch("https://api.openai.com/v1/chat/completions", RequestInit)

  const stream = new ReadableStream({
    async start(controller) {
      const streamParser = async (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === "event") {
          const data = event.data
          if (data === "[DONE]") {
            controller.close()
            return
          }
          try {
            const json = JSON.parse(data)
            const text = json.choices[0].delta?.content
            const queue = encoder.encode(text)
            controller.enqueue(queue)

            const recordData = {
              user_input: messages,
              generated_text: text,
            }

            // ;(async () => {
            //   const recordApiUrl = "/api/logchat"
            //   const response = await fetch(recordApiUrl, {
            //     method: "POST",
            //     headers: {
            //       "Content-Type": "application/json",
            //     },
            //     body: JSON.stringify(recordData),
            //   })

            //   if (!response.ok) {
            //     throw new Error("Failed to save the record.")
            //   }
            // })()
          } catch (e) {
            controller.error(e)
          }
        }
      }

      const parser = createParser(streamParser)
      for await (const chunk of completion.body as any) {
        parser.feed(decoder.decode(chunk))
      }
    },
  })

  return new Response(stream)
}
