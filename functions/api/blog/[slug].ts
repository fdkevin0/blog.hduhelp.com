import { Client } from '@notionhq/client'
import { Env, getBlocks, getDatabase, getPage } from '../../utils/notion'
import { jsonResponse } from '../../utils/response';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil, params }) => {
  const url = new URL(request.url)
  let cache = await caches.open("custom:cache")
  let response = await cache.match(url.pathname)

  if (!response) {
    const notion = new Client({ auth: env.NOTION_KEY })
    const slug: string = params.slug as string
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

    response = new Response(JSON.stringify({ page, blocks: blocksWithChildren }), {
      headers: { "Content-Type": "application/json", 'Cache-Control': 's-maxage=10' }
    })
    waitUntil(cache.put(url.pathname, response.clone()))
  }

  return response
};
