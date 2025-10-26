export async function randomDelay(min = 200, max = 1200) {
  const wait = Math.floor(Math.random() * (max - min + 1)) + min
  await new Promise(r => setTimeout(r, wait))
}

export async function maybeFail({ write = false, rate = 0.08 } = {}) {
  if (!write) return
  if (Math.random() < rate) {
    const err = new Error('Randomized server error')
    err.status = 500
    throw err
  }
}
