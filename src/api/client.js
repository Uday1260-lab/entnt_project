export async function apiGet(url, params = {}) {
  const qs = new URLSearchParams(params).toString()
  const full = qs ? `${url}?${qs}` : url
  const res = await fetch(full)
  if (!res.ok) throw new Error(await res.text() || res.statusText)
  return res.json()
}

export async function apiSend(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await res.text() || res.statusText)
  return res.json()
}
