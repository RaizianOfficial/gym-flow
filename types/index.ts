export * from "@prisma/client"

export type UserRole = "OWNER" | "MEMBER"

export interface CustomSessionUser {
  id: string
  email: string
  role: UserRole
  gymId: string | null
  gymSlug: string | null
}
