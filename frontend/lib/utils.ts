import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// image
export function getImageSrc(image?: string | null) {
  if (!image) return "/placeholder.svg"

  if (image.startsWith("data:image")) {
    return image
  }

  // if the image is jpeg
  return `data:image/jpeg;base64,${image}`
  // image is png
  // return `data:image/png;base64,${image}`
}