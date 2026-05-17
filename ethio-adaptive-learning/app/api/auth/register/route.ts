import { createElement } from "react"
import { NextResponse } from "next/server"

import { createStudentUser } from "@/lib/users"
import { sendEmail } from "@/lib/email/send-email"
import { WelcomeTemplate } from "@/lib/email/templates"
import { verifyRecaptcha } from "@/lib/verify-recaptcha"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string
      email?: string
      password?: string
      recaptchaToken?: string
    }

    const username = body.username?.trim() ?? ""
    const email = body.email?.trim().toLowerCase() ?? ""
    const password = body.password ?? ""
    const recaptchaToken = body.recaptchaToken ?? ""

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long." },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      )
    }

    // Verify CAPTCHA token
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: "Please complete the CAPTCHA verification." },
        { status: 400 }
      )
    }

    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken)
    if (!isRecaptchaValid) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed. Please try again." },
        { status: 400 }
      )
    }

    const user = await createStudentUser({
      username,
      email,
      password,
    })

    const dashboardUrl = `${APP_URL}/dashboard`
    const template = createElement(WelcomeTemplate, {
      userName: user.name ?? user.username,
      dashboardUrl,
    })

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Welcome to EthioPrep",
      template,
    })

    if (!emailResult.success) {
      console.error("Welcome email failed", {
        userId: user.id,
        email: user.email,
        error: emailResult.error,
      })
    }

    console.info("Student registration succeeded", { userId: user.id })

    return NextResponse.json(
      {
        ok: true,
        userId: user.id,
      },
      { status: 201 }
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create your account right now."

    console.error("Student registration failed", error)

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
