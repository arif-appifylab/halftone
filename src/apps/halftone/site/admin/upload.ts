import { putFile, type UploadGrant } from '../../../../platform/files-browser'
import { api, ApiError } from '../lib/api'

export const ACCEPTED_IMAGES = 'image/png,image/jpeg,image/webp,image/gif,image/avif'
const MAX_BYTES = 8 * 1024 * 1024

/**
 * Uploads one image to the site's file storage and returns its public URL
 * ("/__platform/files/<id>/<name>"). Three steps (docs/agent/files.md): ask the
 * Site API for an upload URL, PUT the bytes straight to storage, confirm.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!ACCEPTED_IMAGES.split(',').includes(file.type)) throw new ApiError(415, 'Use a PNG, JPEG, WebP, GIF or AVIF image')
  if (file.size > MAX_BYTES) throw new ApiError(413, 'That image is too large (max 8 MB)')
  const grant = await api<{ fileId: string; upload: UploadGrant['upload'] }>('admin/uploads', {
    method: 'POST',
    body: { name: file.name, contentType: file.type, size: file.size },
  })
  const put = await putFile(grant.upload, file)
  if (!put.ok) throw new ApiError(put.status, put.message)
  const done = await api<{ url: string }>(`admin/uploads/${encodeURIComponent(grant.fileId)}/complete`, { method: 'POST' })
  return done.url
}

/** First image file in a paste/drop, if any. */
export const imageFrom = (files?: FileList | null) => Array.from(files ?? []).find((f) => f.type.startsWith('image/'))
