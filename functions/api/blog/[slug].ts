import { Client } from '@notionhq/client'
import { Env, getBlocks, getDatabase, getPage } from '../../notion'

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil, params }) => {
  try {
    let cache = await caches.open("custom:cache")
    let cacheKey = request.url
    let response = await cache.match(cacheKey)

    if (!response) {
      const slug: string = params.slug as string
      const { value, metadata } = await env.KV_STORE.getWithMetadata<{cacheDate: string}>(cacheKey)
      if (!value || !metadata) {
        response = await fetchAndCache(env, cache, cacheKey, slug)
      } else {
        const cacheDate = new Date(metadata.cacheDate)
        const cacheAge = (Date.now() - cacheDate.getTime()) / 1000
        if (cacheAge > 300) {
          waitUntil(fetchAndCache(env, cache, cacheKey, slug))
        }
        response = new Response(value, {
          headers: { "Content-Type": "application/json", 'Cache-Control': 's-maxage=300' }
        })
      }
    }
    await env.KV_STORE.put(cacheKey, await response.text())
    return response
  } catch (error: any) {
    return new Response(error.toString(), { status: 500 })
  }
};

async function fetchAndCache(env: Env, cache: Cache, cacheKey: string, slug: string) {
  const { page, blocks } = await fetchPage(env, slug)
  const responseBody = JSON.stringify({ page, blocks })
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

async function fetchPage(env: Env, slug: string) {
  const notion = new Client({ auth: env.NOTION_KEY })
  const posts = await getDatabase(env.NOTION_DATABASE_ID, notion, slug)
  const post = posts[0].id
  const page = await getPage(notion, post)
  const blocks = await getBlocks(notion, post)
  const childBlocks = await Promise.all(
    blocks
      .filter((b: any) => b.has_children)
      .map(async b => {
        return {
          id: b.id,
          children: await getBlocks(notion, b.id),
        }
      })
  )
  const blocksWithChildren = blocks.map((b: any) => {
    if (b.has_children && !b[b.type].children) {
      b[b.type]['children'] = childBlocks.find(x => x.id === b.id)?.children
    }
    return b
  })

  // await Promise.all(
  //   blocksWithChildren
  //     .filter((b: any) => b.type === 'image')
  //     .map(async b => {
  //       const { type } = b
  //       const value = b[type]
  //       const src = value.type === 'external' ? value.external.url : value.file.url

  //       const { width, height } = await probeImageSize(src)
  //       value['dim'] = { width, height }
  //       b[type] = value
  //     })
  // )
  return {
    page,
    blocks: blocksWithChildren,
  }
}