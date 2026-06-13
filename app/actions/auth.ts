"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function registerGym(formData: {
  gymName: string
  slug: string
  email: string
  password: any
}) {
  const { gymName, slug, email, password } = formData

  if (!gymName || !slug || !email || !password) {
    return { error: "All fields are required" }
  }

  const normalizedSlug = slug.toLowerCase().trim()
  
  if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
    return { error: "Slug must contain only lowercase letters, numbers, and hyphens" }
  }

  try {
    const existingGym = await prisma.gym.findUnique({
      where: { slug: normalizedSlug }
    })

    if (existingGym) {
      return { error: "Gym slug is already taken" }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { error: "Email is already registered" }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Create Gym and User inside a transaction
    await prisma.gym.create({
      data: {
        name: gymName,
        slug: normalizedSlug,
        ownerEmail: email,
        plan: "FREE",
        users: {
          create: {
            email: email,
            password: hashedPassword,
            role: "OWNER"
          }
        }
      }
    })
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Something went wrong during registration. Please try again." }
  }

  // Perform sign in after registration
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: `/${normalizedSlug}/dashboard`
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Auto-login failed. Please log in manually." }
    }
    // NextAuth relies on throwing a redirect error to perform redirects. 
    // We must re-throw it so Next.js handles it.
    throw error
  }
}

export async function loginUser(formData: {
  email: string
  password: any
}) {
  const { email, password } = formData

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  let gymSlug = ""
  let userRole = ""
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { gym: true }
    })

    if (!user) {
      return { error: "Invalid email or password" }
    }

    gymSlug = user.gym?.slug || ""
    userRole = user.role
    if (!gymSlug) {
      return { error: "This account is not associated with any gym tenant." }
    }
  } catch (error) {
    console.error("Database login query error:", error)
    return { error: "Failed to connect to the database." }
  }

  try {
    const redirectTo = userRole === "MEMBER" ? `/${gymSlug}/me` : `/${gymSlug}/dashboard`
    await signIn("credentials", {
      email,
      password,
      redirectTo
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" }
    }
    throw error
  }
}
