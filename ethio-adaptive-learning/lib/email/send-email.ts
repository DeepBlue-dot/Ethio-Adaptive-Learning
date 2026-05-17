import { resend } from "./resend"

type SendEmailOptions = {
  to: string
  subject: string
  template: React.ReactElement
  from?: string
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export async function sendEmail({
  to,
  subject,
  template,
  from = "noreply@ethioadaptive.local",
}: SendEmailOptions): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Email sending is disabled.")
    return {
      success: true,
      messageId: "mock-id",
    }
  }

  const maxAttempts = 3
  let attempt = 0

  while (attempt < maxAttempts) {
    attempt += 1

    try {
      const response = await resend.emails.send({
        from,
        to,
        subject,
        react: template,
      })

      if (response.error) {
        console.error("Resend error:", response.error)
        return {
          success: false,
          error: response.error.message,
        }
      }

      return {
        success: true,
        messageId: response.data?.id,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      const shouldRetry = attempt < maxAttempts

      console.error(
        `Failed to send email (attempt ${attempt}/${maxAttempts}):`,
        message
      )

      if (!shouldRetry) {
        return {
          success: false,
          error: message,
        }
      }

      await sleep(attempt * 500)
    }
  }

  return {
    success: false,
    error: "Unable to send email after multiple attempts.",
  }
}
