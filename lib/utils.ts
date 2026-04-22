import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Normalize phone for wa.me links: no +, Moroccan 06/07 → 212… */
export function formatPhoneForWhatsApp(phone: string): string {
  let s = phone.replace(/[\s-]/g, '').replace(/^\+/, '')
  if (s.startsWith('06') || s.startsWith('07')) {
    s = `212${s.slice(1)}`
  }
  return s
}
