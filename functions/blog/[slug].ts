export const onRequestGet: PagesFunction = async ({ request }) => {
  let url = new URL(request.url)
  url.hostname = "/"
  return fetch(url.toString())
};
