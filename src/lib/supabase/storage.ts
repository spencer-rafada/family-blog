import { createClient } from './client'

export async function uploadImage(file: File, bucket: string = 'post-images'): Promise<string | null> {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('User not authenticated')
    return null
  }
  
  // Generate unique filename with user folder
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${user.id}/${fileName}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Error uploading image:', error.message)
    return null
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}

export async function deleteImage(url: string, bucket: string = 'post-images'): Promise<boolean> {
  const supabase = createClient()
  
  // Extract file path from URL
  const urlParts = url.split('/')
  const fileName = urlParts[urlParts.length - 1]
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName])

  if (error) {
    console.error('Error deleting image:', error.message)
    return false
  }

  return true
}