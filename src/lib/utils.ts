import { clsx, type ClassValue } from 'clsx'
import { nanoid } from 'nanoid'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Generate a secure access token for forms
 */
export function generateAccessToken(): string {
  const timestamp = Date.now()
  const randomId = nanoid(32)
  return `fv_${randomId}_${timestamp}`
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Validate Turkish TC number
 */
export function validateTCNumber(tc: string): boolean {
  if (!/^[0-9]{11}$/.test(tc)) return false
  
  const digits = tc.split('').map(Number)
  
  // First digit cannot be 0
  if (digits[0] === 0) return false
  
  // Calculate check digits
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7]
  const checkDigit1 = ((oddSum * 7) - evenSum) % 10
  const checkDigit2 = (oddSum + evenSum + digits[9]) % 10
  
  return digits[9] === checkDigit1 && digits[10] === checkDigit2
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Turkish mobile format
  if (cleaned.startsWith('90') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`
  }
  
  // Turkish mobile without country code
  if (cleaned.startsWith('5') && cleaned.length === 10) {
    return `+90 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`
  }
  
  // Return as is if doesn't match Turkish format
  return phone
}

/**
 * Get initials from full name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Generate random color for avatars
 */
export function generateAvatarColor(seed: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
  ]
  
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Debounce function for search
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Check if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  return emailRegex.test(email)
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}