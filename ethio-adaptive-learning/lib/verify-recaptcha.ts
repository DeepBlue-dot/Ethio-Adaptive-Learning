export async function verifyRecaptcha(
  token: string
) {
  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret:
          process.env.RECAPTCHA_SECRET_KEY!,
        response: token,
      }),
    }
  )

  const data = await response.json()

  return data.success === true
}