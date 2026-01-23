import { clsx, type ClassValue } from 'clsx'
import { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
