import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { uploadImage, compressImage, validateImageFile, getSignedUrl, type UploadImageType } from '@/services/imageService'
import { toast } from 'sonner'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  type: UploadImageType
}

interface ImageItem {
  url: string
  file?: File
  isUploading?: boolean
  hasError?: boolean
  errorMessage?: string
}

export function ImageUpload({ images, onImagesChange, maxImages = 5, type }: ImageUploadProps) {
  const [imageItems, setImageItems] = useState<ImageItem[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Resolve images prop (which may contain stored paths or absolute URLs) to fresh URLs
  useEffect(() => {
    let mounted = true

    const resolveImages = async () => {
      const resolved: ImageItem[] = []

      for (const img of images) {
        try {
          // If the image looks like a storage path (no protocol), generate signed URL
          if (!img.startsWith('http')) {
            const signed = await getSignedUrl(img)
            resolved.push({ url: signed })
          } else {
            resolved.push({ url: img })
          }
        } catch (err) {
          console.error('Error resolving image URL', err)
          // push a placeholder entry to keep indexes stable
          resolved.push({ url: '' , hasError: true, errorMessage: 'Impossible de charger l\'image' })
        }
      }

      if (mounted) setImageItems(resolved)
    }

    resolveImages()

    return () => { mounted = false }
  }, [images])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (imageItems.length + acceptedFiles.length > maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`)
      return
    }

    setIsUploading(true)
    
    for (const file of acceptedFiles) {
      const validationError = validateImageFile(file)
      if (validationError) {
        toast.error(validationError)
        continue
      }

      let compressedFile: File | undefined
      
      try {
        compressedFile = await compressImage(file)
        
        const tempItem: ImageItem = {
          url: URL.createObjectURL(compressedFile),
          file: compressedFile,
          isUploading: true
        }
        
        setImageItems(prev => [...prev, tempItem])

        const result = await uploadImage(compressedFile, type)

        // Replace temp item with a signed URL for display, but store the path in parent state
        setImageItems(prev => 
          prev.map(item => 
            item.file === compressedFile 
              ? { url: result.url, isUploading: false, hasError: false }
              : item
          )
        )

        const newImages = [...images, result.path]
        onImagesChange(newImages)
        
        toast.success('Image téléchargée avec succès')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du téléchargement'
        
        if (compressedFile) {
          setImageItems(prev => 
            prev.map(item => 
              item.file === compressedFile 
                ? { 
                    ...item, 
                    isUploading: false, 
                    hasError: true, 
                    errorMessage 
                  }
                : item
            )
          )
        }
        
        toast.error(errorMessage)
      }
    }
    
    setIsUploading(false)
  }, [imageItems.length, maxImages, type, images, onImagesChange])

  const removeImage = (index: number) => {
    const newImageItems = imageItems.filter((_, i) => i !== index)
    setImageItems(newImageItems)
    
    const newImages = newImageItems
      .filter(item => !item.isUploading && !item.hasError)
      .map(item => item.url)
    onImagesChange(newImages)
  }

  const retryUpload = async (index: number) => {
    const item = imageItems[index]
    if (!item.file || item.isUploading) return

    setImageItems(prev => 
      prev.map((img, i) => 
        i === index 
          ? { ...img, isUploading: true, hasError: false, errorMessage: undefined }
          : img
      )
    )

    try {
      const result = await uploadImage(item.file, type)
      
      setImageItems(prev => 
        prev.map((img, i) => 
          i === index 
            ? { url: result.url, isUploading: false, hasError: false }
            : img
        )
      )

  const newImages = [...images, result.path]
  onImagesChange(newImages)
      
      toast.success('Image téléchargée avec succès')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du téléchargement'
      
      setImageItems(prev => 
        prev.map((img, i) => 
          i === index 
            ? { 
                ...img, 
                isUploading: false, 
                hasError: true, 
                errorMessage 
              }
            : img
        )
      )
      
      toast.error(errorMessage)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    disabled: isUploading || imageItems.length >= maxImages
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {imageItems.map((item, index) => (
          <Card key={index} className={`h-52 w-52 relative group overflow-hidden ${item.hasError ? 'ring-2 ring-red-300 bg-red-50' : ''}`}>
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <img
                  src={item.url}
                  alt={`Image ${index + 1}`}
                  className={`w-full h-full object-cover ${item.hasError ? 'opacity-50' : ''}`}
                />
                
                {item.isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
                
                {item.hasError && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                    <div className="bg-red-100 rounded-full p-2">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                )}
                
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.hasError && item.file && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                      onClick={() => retryUpload(index)}
                      disabled={item.isUploading}
                      title="Réessayer le téléchargement"
                    >
                      <RefreshCw className="h-4 w-4 text-white" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => removeImage(index)}
                    disabled={item.isUploading}
                    title="Supprimer l'image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {item.hasError && item.errorMessage && (
                <div className="p-2 bg-red-50 border-t border-red-200">
                  <p className="text-xs text-red-600 truncate" title={item.errorMessage}>
                    {item.errorMessage}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {imageItems.length < maxImages && (
        <Card
          {...getRootProps()}
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <CardContent className="p-8">
            <input {...getInputProps()} />
            <div className="text-center">
              {isDragActive ? (
                <div className="flex flex-col items-center">
                  <ImageIcon className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm text-primary">Déposez les images ici...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Glissez vos images ici ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, WebP - Max 2MB par image ({maxImages - imageItems.length} restantes)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {imageItems.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>{imageItems.length}/{maxImages} images sélectionnées</span>
          </div>
          {imageItems.some(item => item.hasError) && (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-xs">
                {imageItems.filter(item => item.hasError).length} erreur(s) - Cliquez pour réessayer
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
