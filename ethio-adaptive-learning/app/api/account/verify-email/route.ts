import { createElement } from "react"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createEmailVerificationToken } from "@/lib/users"
import { sendEmail } from "@/lib/email/send-email"
import { VerifyEmailTemplate } from "@/lib/email/templates"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if email is already verified
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Create verification token
    const token = await createEmailVerificationToken(user.email)

    if (!token) {
      return NextResponse.json(
        { error: "Failed to create verification token" },
        { status: 500 }
      )
    }

    // Build verification URL and send email
    const verificationUrl = `${APP_URL}/api/auth/verify-account?email=${encodeURIComponent(
      user.email
    )}&token=${encodeURIComponent(token)}`

    const template = createElement(VerifyEmailTemplate, {
      userEmail: user.email,
      verificationUrl,
      userName: user.email,
    })

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Verify your EthioPrep email address",
      template,
    })

    if (!emailResult.success) {
      console.error("Verification email delivery failed", {
        email: user.email,
        error: emailResult.error,
      })
      // still return 200 to avoid leaking account existence, but include token in dev
    }

    return NextResponse.json(
      {
        message: "Verification email request processed",
        token: process.env.NODE_ENV === "development" ? token : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Email verification request error:", error)
    return NextResponse.json(
      { error: "Failed to request email verification" },
      { status: 500 }
    )
  }
}
