import { useEffect, useState } from 'react'
import { getSignedUrl } from '@/services/imageService'

type StorageImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null
}

export function StorageImage({ src, alt = '', ...props }: StorageImageProps) {
  const [url, setUrl] = useState<string | undefined>()
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    let mounted = true
    const resolve = async () => {
      setErrored(false)
      if (!src) {
        setUrl(undefined)
        return
      }
      try {
        if (src.startsWith('http')) {
          if (mounted) setUrl(src)
        } else {
          const signed = await getSignedUrl(src)
          if (mounted) setUrl(signed)
        }
      } catch (err) {
        console.error('StorageImage error resolving URL', err)
        if (mounted) {
          setUrl(undefined)
          setErrored(true)
        }
      }
    }

    resolve()
    return () => { mounted = false }
  }, [src])

  if (!src || errored) {
    return (
      <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium">Aucune image</p>
        </div>
      </div>
    )
  }

  return (
    <img src={url} alt={alt} {...props} />
  )
}
