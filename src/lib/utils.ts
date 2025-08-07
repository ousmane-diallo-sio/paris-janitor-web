import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amountCents: number, currencyCode: string = 'EUR'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currencyCode,
  }).format(amountCents / 100)
}

export const parseCurrencyToCents = (amount: number): number => {
  return Math.round(amount * 100)
}

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
