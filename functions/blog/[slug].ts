export const onRequestGet: PagesFunction = async ({ request }) => {
    let url = new URL(request.url)
    url.pathname = "/"
    return await fetch(url.toString())
};