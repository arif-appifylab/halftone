import { useEffect, useState } from 'react'

/** Types, holds, deletes and cycles through words. */
export function useTypewriter(words: string[], { type = 70, erase = 35, hold = 1600 } = {}) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[index % words.length]
    let delay = deleting ? erase : type
    if (!deleting && text === word) delay = hold
    if (deleting && text === '') delay = 250

    const t = setTimeout(() => {
      if (!deleting && text === word) setDeleting(true)
      else if (deleting && text === '') {
        setDeleting(false)
        setIndex((i) => i + 1)
      } else setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1))
    }, delay)
    return () => clearTimeout(t)
  }, [text, deleting, index, words, type, erase, hold])

  return text
}
