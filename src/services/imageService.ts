import { supabase } from '@/lib/supabase'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
// Change this to 'image-bucket' if you want to use existing bucket
const BUCKET_NAME = 'image-bucket'

export interface ImageUploadResult {
  url: string
  path: string
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Format non supporté. Utilisez JPEG, PNG ou WebP.'
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return 'Le fichier est trop volumineux (max 2MB).'
  }
  
  return null
}

export async function uploadPropertyImage(file: File, propertyId?: string): Promise<ImageUploadResult> {
  const validationError = validateImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${propertyId || 'temp'}-${Date.now()}.${fileExt}`
  const filePath = `properties/${fileName}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error('Erreur lors du téléchargement de l\'image')
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return {
    url: publicUrl,
    path: data.path
  }
}

export async function deletePropertyImage(imagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([imagePath])

  if (error) {
    console.error('Delete error:', error)
    throw new Error('Erreur lors de la suppression de l\'image')
  }
}

export function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      const { width, height } = img
      const ratio = Math.min(maxWidth / width, maxWidth / height)
      
      canvas.width = width * ratio
      canvas.height = height * ratio

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        },
        file.type,
        quality
      )
    }

    img.src = URL.createObjectURL(file)
  })
}
