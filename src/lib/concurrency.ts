export function pLimit(concurrency: number) {
  if (concurrency < 1) throw new Error('concurrency must be >= 1')
  const queue: (() => void)[] = []
  let active = 0

  const next = () => {
    active--
    queue.shift()?.()
  }

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++
        fn().then(resolve, reject).finally(next)
      }
      if (active < concurrency) run()
      else queue.push(run)
    })
}
