import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string | null
      agencyId?: string | null
      agency?: {
        id: string
        name: string
      } | null
      needsRegistration?: boolean
    }
  }

  interface User {
    id: string
    role?: string | null
    agencyId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string
  }
}