interface WelcomeProps {
  userName?: string
  dashboardUrl?: string
}

export const WelcomeTemplate = ({ userName, dashboardUrl = "https://ethioadaptive.local/student" }: WelcomeProps) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome to EthioPrep - Your Adaptive Learning Platform</title>
    </head>
    <body style={main}>
      <div style={container}>
        <div style={box}>
          <div style={{ marginTop: '16px' }}>
            <h1 style={heading}>Welcome to EthioPrep! 🎓</h1>
          </div>
          <hr style={hr} />
          <div style={{ marginTop: '16px' }}>
            <p style={paragraph}>
              Hi {userName || "there"},
            </p>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={paragraph}>
              Thank you for joining EthioPrep, your personalized adaptive learning platform. Your account has been successfully verified and is ready to use!
            </p>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={paragraph}>
              Here&apos;s what you can do now:
            </p>
          </div>
          <div style={{ marginTop: '8px' }}>
            <p style={featureText}>
              ✓ Access personalized learning paths tailored to your level
              <br />
              ✓ Practice with AI-powered adaptive questions
              <br />
              ✓ Track your progress and get detailed insights
              <br />
              ✓ Prepare for exams with our comprehensive curriculum
            </p>
          </div>
          <div style={buttonContainer}>
            <a href={dashboardUrl} style={button}>
              Go to Dashboard
            </a>
          </div>
          <hr style={hr} />
          <div style={{ marginTop: '16px' }}>
            <p style={paragraph}>
              <strong>Getting Started Tips:</strong>
            </p>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={paragraph}>
              1. Complete your profile with your grade level and subjects of interest
              <br />
              2. Take a diagnostic assessment to personalize your learning path
              <br />
              3. Start learning with our interactive lessons and practice problems
            </p>
          </div>
          <hr style={hr} />
          <div style={{ marginTop: '8px' }}>
            <p style={footerText}>
              If you have any questions or need help, feel free to reach out to our support team.
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

const featureText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "8px 0",
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
