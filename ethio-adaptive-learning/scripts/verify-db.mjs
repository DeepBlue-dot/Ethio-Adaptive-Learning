import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function verify() {
  try {
    const unusedCount = await prisma.mediaAsset.count({
      where: {
        usageLinks: { none: {} }
      }
    })
    console.log(`Success! Unused media assets count: ${unusedCount}`)
  } catch (error) {
    console.error("Verification failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

verify()
