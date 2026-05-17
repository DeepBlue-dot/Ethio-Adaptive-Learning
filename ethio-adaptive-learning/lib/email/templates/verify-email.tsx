interface VerifyEmailProps {
  userEmail: string
  verificationUrl: string
  userName?: string
}

export const VerifyEmailTemplate = ({ userEmail, verificationUrl, userName }: VerifyEmailProps) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Verify your EthioPrep email address</title>
    </head>
    <body style={main}>
      <div style={container}>
        <div style={box}>
          <div style={{ marginTop: '16px' }}>
            <h1 style={heading}>Verify your email address</h1>
          </div>
          <hr style={hr} />
          <div style={{ marginTop: '16px' }}>
            <p style={paragraph}>
              Hi {userName || "there"},
            </p>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={paragraph}>
              Thank you for signing up with EthioPrep! To complete your registration, please verify your email address by clicking the button below.
            </p>
          </div>
          <div style={buttonContainer}>
            <a href={verificationUrl} style={button}>
              Verify Email Address
            </a>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={paragraph}>
              Or copy and paste this link in your browser:
            </p>
          </div>
          <div style={{ marginTop: '16px' }}>
            <a href={verificationUrl} style={link}>
              {verificationUrl}
            </a>
          </div>
          <hr style={hr} />
          <div style={{ marginTop: '8px' }}>
            <p style={footerText}>
              If you did not create this account, please ignore this email.
            </p>
          </div>
          <div style={{ marginTop: '8px' }}>
            <p style={footerText}>
              © 2026 EthioPrep. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>
)

const main = {
  backgroundColor: "#f9fafb",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
}

const box = {
  padding: "0 48px",
}

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
}

const paragraph = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
}

const link = {
  color: "#2563eb",
  textDecoration: "underline",
  fontSize: "14px",
}

const heading = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "16px 0",
}

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
}
