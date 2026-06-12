import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Database seeding started...")

  // Clean old seed records
  await prisma.attendance.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.member.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.gym.deleteMany({})

  const hashedPassword = await bcrypt.hash("password123", 10)

  // 1. Create Gym + 2. Create Gym Owner User record
  const gym = await prisma.gym.create({
    data: {
      name: "Test Gym",
      slug: "testgym",
      ownerEmail: "owner@testgym.com",
      plan: "FREE",
      users: {
        create: {
          email: "owner@testgym.com",
          password: hashedPassword,
          role: "OWNER",
        },
      },
    },
  })

  console.log(`Created Gym: ${gym.name} (slug: ${gym.slug})`)

  const today = new Date()

  // 3. Create dummy members
  
  // Member 1: ACTIVE (expiry 30 days from now)
  const activeExpiry = new Date(today)
  activeExpiry.setDate(activeExpiry.getDate() + 30)
  activeExpiry.setHours(23, 59, 59, 999)

  await prisma.member.create({
    data: {
      gymId: gym.id,
      fullName: "Active Member",
      phone: "9999911111",
      email: "active@member.com",
      membershipPlan: "MONTHLY",
      startDate: today,
      expiryDate: activeExpiry,
      paymentStatus: "PAID",
      status: "ACTIVE",
    },
  })

  // Member 2: EXPIRING_SOON (expiry 3 days from now)
  const expiringExpiry = new Date(today)
  expiringExpiry.setDate(expiringExpiry.getDate() + 3)
  expiringExpiry.setHours(23, 59, 59, 999)

  await prisma.member.create({
    data: {
      gymId: gym.id,
      fullName: "Expiring Member",
      phone: "9999922222",
      email: "expiring@member.com",
      membershipPlan: "MONTHLY",
      startDate: today,
      expiryDate: expiringExpiry,
      paymentStatus: "PAID",
      status: "EXPIRING_SOON",
    },
  })

  // Member 3: EXPIRED (expiry 5 days ago)
  const expiredStart = new Date(today)
  expiredStart.setDate(expiredStart.getDate() - 35)
  const expiredExpiry = new Date(today)
  expiredExpiry.setDate(expiredExpiry.getDate() - 5)
  expiredExpiry.setHours(23, 59, 59, 999)

  await prisma.member.create({
    data: {
      gymId: gym.id,
      fullName: "Expired Member",
      phone: "9999933333",
      email: "expired@member.com",
      membershipPlan: "MONTHLY",
      startDate: expiredStart,
      expiryDate: expiredExpiry,
      paymentStatus: "OVERDUE",
      status: "EXPIRED",
    },
  })

  console.log("Database seeding completed successfully!")
  await pool.end()
}

main()
  .catch((e) => {
    console.error("Seeding error:", e)
    process.exit(1)
  })
