import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateDailyToken(gymSlug: string, dateStr: string) {
  const secret = process.env.NEXTAUTH_SECRET || "gymflow-secret-change-in-production"
  return crypto
    .createHash("sha256")
    .update(`${gymSlug}-${dateStr}-${secret}`)
    .digest("hex")
}
