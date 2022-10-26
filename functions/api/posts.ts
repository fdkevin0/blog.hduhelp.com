import { Client } from '@notionhq/client'
import { Env, getDatabase } from '../notion'

export const onRequestGet: PagesFunction<Env> = async ({ request, waitUntil, env }) => {
  let cache = await caches.open("custom:cache")
  let cacheKey = request.url
  let response = await cache.match(cacheKey)
  if (!response) {
    const notion = new Client({ auth: env.NOTION_KEY })
    const posts = await getDatabase(env.NOTION_DATABASE_ID, notion)
    response = new Response(JSON.stringify(posts), {
      headers: { "Content-Type": "application/json", 'Cache-Control': 's-maxage=300' }
    })
    waitUntil(cache.put(cacheKey, response))
    return response
  }
  return response
};

async function fetchAndCache(env: Env, cache: Cache, cacheKey: string) {
  const posts = await fetchPages(env)
  const responseBody = JSON.stringify(posts)
  const response = new Response(responseBody, {
    headers: { "Content-Type": "application/json", 'Cache-Control': 's-maxage=300' }
  })
  await cache.put(cacheKey, response)
  await env.KV_STORE.put(cacheKey, responseBody, {
    metadata: {
      cacheDate: new Date().toISOString(),
    }
  })
  return response
}

async function fetchPages(env: Env) {
  const notion = new Client({ auth: env.NOTION_KEY })
  const posts = await getDatabase(env.NOTION_DATABASE_ID, notion)
  return posts
}