export const onRequestGet: PagesFunction = async ({ request }) => {
    let url = new URL(request.url)
    url.pathname = "/"
    let response = await fetch(url.toString())
    return response
};