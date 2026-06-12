import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const members = await prisma.member.findMany({
      include: {
        notifications: true,
      },
    })

    const notificationsToCreate = []

    for (const member of members) {
      const expiry = new Date(member.expiryDate)
      expiry.setHours(0, 0, 0, 0)

      const diffTime = expiry.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let type: "EXPIRY_5" | "EXPIRY_3" | "EXPIRY_1" | "EXPIRED" | null = null

      if (expiry < today) {
        type = "EXPIRED"
      } else if (diffDays === 5) {
        type = "EXPIRY_5"
      } else if (diffDays === 3) {
        type = "EXPIRY_3"
      } else if (diffDays === 1) {
        type = "EXPIRY_1"
      }

      if (type) {
        const alreadyExists = member.notifications.some((n) => n.type === type)
        if (!alreadyExists) {
          notificationsToCreate.push({
            gymId: member.gymId,
            memberId: member.id,
            type,
            seen: false,
          })
        }
      }
    }

    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate,
      })
    }

    return NextResponse.json({
      success: true,
      createdCount: notificationsToCreate.length,
    })
  } catch (err) {
    console.error("Cron check-expiry failure:", err)
    return NextResponse.json({ error: "Check-expiry task failed" }, { status: 500 })
  }
}
