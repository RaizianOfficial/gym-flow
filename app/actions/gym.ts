"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { generateDailyToken } from "@/lib/utils"

// Helper to map duration days to plan names
function mapDaysToPlanName(days: number): string {
  switch (days) {
    case 30:
      return "MONTHLY"
    case 90:
      return "QUARTERLY"
    case 180:
      return "HALFYEARLY"
    case 365:
      return "ANNUAL"
    default:
      return "MONTHLY"
  }
}

// Helper to calculate status based on expiry date
function calculateMemberStatus(expiryDate: Date): "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  
  if (expiry < today) {
    return "EXPIRED"
  }
  
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 7) {
    return "EXPIRING_SOON"
  }
  
  return "ACTIVE"
}

export async function addMember(formData: {
  fullName: string
  phone: string
  email?: string
  planDays: number
  startDate: string
  paymentStatus: "PAID" | "PENDING"
  notes?: string
}) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized access")
  }
  
  const user = session.user as any
  if (!user.gymId) {
    throw new Error("No gym associated with this account")
  }

  const { fullName, phone, email, planDays, startDate, paymentStatus, notes } = formData

  if (!fullName || !phone || !planDays || !startDate) {
    return { error: "All required fields must be completed." }
  }

  try {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    
    const expiry = new Date(start)
    expiry.setDate(expiry.getDate() + planDays)
    expiry.setHours(23, 59, 59, 999)

    const status = calculateMemberStatus(expiry)
    const planName = mapDaysToPlanName(planDays)

    // Log the member
    const member = await prisma.member.create({
      data: {
        gymId: user.gymId,
        fullName,
        phone,
        email: email || null,
        membershipPlan: planName,
        startDate: start,
        expiryDate: expiry,
        paymentStatus: paymentStatus === "PAID" ? "PAID" : "PENDING",
        status,
        notes: notes || null
      }
    })

    // Log payment if status is PAID
    if (paymentStatus === "PAID") {
      let defaultAmount = 1000 // default fallback
      if (planDays === 30) defaultAmount = 1000
      else if (planDays === 90) defaultAmount = 2700
      else if (planDays === 180) defaultAmount = 5000
      else if (planDays === 365) defaultAmount = 9000

      await prisma.payment.create({
        data: {
          gymId: user.gymId,
          memberId: member.id,
          amount: defaultAmount,
          plan: planName,
          note: "Initial subscription payment"
        }
      })
    }

    revalidatePath(`/${user.gymSlug}/dashboard`)
    revalidatePath(`/${user.gymSlug}/members`)

    return { success: true }
  } catch (error) {
    console.error("Error creating member:", error)
    return { error: "Failed to add member to database." }
  }
}

export async function renewMember(formData: {
  memberId: string
  durationDays: number
  amount: number
  note?: string
}) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized access")
  }

  const user = session.user as any
  if (!user.gymId) {
    throw new Error("No gym associated with this account")
  }

  const { memberId, durationDays, amount, note } = formData

  if (!memberId || !durationDays || amount === undefined) {
    return { error: "Required fields are missing." }
  }

  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    })

    if (!member || member.gymId !== user.gymId) {
      return { error: "Member not found or access denied." }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const currentExpiry = new Date(member.expiryDate)
    
    // If expired, renew from today. Otherwise, extend from current expiry.
    const baseDate = currentExpiry >= today ? currentExpiry : today
    const newExpiry = new Date(baseDate)
    newExpiry.setDate(newExpiry.getDate() + durationDays)
    newExpiry.setHours(23, 59, 59, 999)

    const newStatus = calculateMemberStatus(newExpiry)
    const planName = mapDaysToPlanName(durationDays)

    await prisma.$transaction([
      prisma.member.update({
        where: { id: memberId },
        data: {
          expiryDate: newExpiry,
          paymentStatus: "PAID",
          status: newStatus,
          membershipPlan: planName
        }
      }),
      prisma.payment.create({
        data: {
          gymId: user.gymId,
          memberId: memberId,
          amount: Number(amount),
          plan: planName,
          note: note || "Membership renewal"
        }
      })
    ])

    revalidatePath(`/${user.gymSlug}/dashboard`)
    revalidatePath(`/${user.gymSlug}/members`)

    return { success: true }
  } catch (error) {
    console.error("Error renewing membership:", error)
    return { error: "Failed to renew membership." }
  }
}

export async function markAllNotificationsAsRead() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized access")
  }

  const user = session.user as any
  if (!user.gymId) {
    throw new Error("No gym associated with this account")
  }

  try {
    await prisma.notification.updateMany({
      where: {
        gymId: user.gymId,
        seen: false
      },
      data: {
        seen: true
      }
    })

    revalidatePath(`/${user.gymSlug}/dashboard`)
    revalidatePath(`/${user.gymSlug}/members`)

    return { success: true }
  } catch (error) {
    console.error("Failed to mark notifications as read:", error)
    return { error: "Failed to clear notifications." }
  }
}

export async function checkInMember(gymSlug: string, token: string) {
  const session = await auth()
  if (!session?.user) {
    return { redirect: true }
  }

  const user = session.user as any
  if (user.role !== "MEMBER") {
    return { error: "Only members can record check-ins." }
  }

  try {
    const todayStr = new Date().toISOString().split("T")[0]
    const expectedToken = generateDailyToken(gymSlug, todayStr)

    if (token !== expectedToken) {
      return { error: "Invalid or expired QR code. Please scan a fresh QR code at the desk." }
    }

    const gym = await prisma.gym.findUnique({
      where: { slug: gymSlug },
      include: {
        members: {
          where: { email: user.email }
        }
      }
    })

    if (!gym) {
      return { error: "Gym tenant not found." }
    }

    const member = gym.members[0]
    if (!member) {
      return { error: "Member profile not found for this account." }
    }

    if (member.status === "EXPIRED") {
      return { error: "Your membership has expired. Please contact gym administration to renew." }
    }

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const existingCheckin = await prisma.attendance.findFirst({
      where: {
        memberId: member.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    if (existingCheckin) {
      return {
        success: true,
        alreadyCheckedIn: true,
        memberName: member.fullName,
        gymName: gym.name
      }
    }

    // Create attendance checkin
    await prisma.attendance.create({
      data: {
        gymId: gym.id,
        memberId: member.id,
        date: new Date()
      }
    })

    revalidatePath(`/${gymSlug}/attendance`)
    revalidatePath(`/${gymSlug}/dashboard`)

    return {
      success: true,
      alreadyCheckedIn: false,
      memberName: member.fullName,
      gymName: gym.name
    }
  } catch (err) {
    console.error("Check-in registration error:", err)
    return { error: "Failed to record check-in. Try scanning again." }
  }
}
