import { ImageUp, Loader2, Trash2 } from 'lucide-react'
import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ACCEPTED_IMAGES, imageFrom, uploadImage } from '../upload'
import { useToast } from './Toast'

/**
 * Click or drop to upload. Renders `preview` underneath; shows a drop overlay
 * while dragging and a spinner while uploading. Calls `onUploaded` with the URL.
 */
export function ImageDropzone({
  preview,
  hasImage,
  onUploaded,
  onClear,
  className,
}: {
  preview: ReactNode
  hasImage: boolean
  onUploaded: (url: string) => void
  onClear?: () => void
  className?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const upload = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      onUploaded(await uploadImage(file))
      toast('Image uploaded')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    upload(imageFrom(e.dataTransfer.files))
  }

  return (
    <div
      className={cn('group relative overflow-hidden rounded-lg', className)}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {preview}
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={hasImage ? 'Replace image' : 'Upload image'}
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-sm transition-all duration-200 ease-expo',
          dragging ? 'bg-accent/20 text-fg ring-2 ring-inset ring-accent' : 'bg-base/0 text-transparent hover:bg-base/60 hover:text-fg focus-visible:bg-base/60 focus-visible:text-fg',
          !hasImage && !dragging && 'bg-base/40 text-muted',
          busy && 'bg-base/70 text-fg',
        )}
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <ImageUp className="size-5" />}
        <span className="font-medium">{busy ? 'Uploading…' : dragging ? 'Drop to upload' : hasImage ? 'Replace image' : 'Upload image'}</span>
        {!busy && <span className="text-xs opacity-70">or drag a file here · max 8 MB</span>}
      </button>
      {hasImage && onClear && !busy && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Remove image"
          className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md bg-base/80 text-muted opacity-0 backdrop-blur transition-opacity hover:text-alert group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGES}
        className="hidden"
        onChange={(e) => {
          upload(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
