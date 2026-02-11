import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { name, email, message, service } = body;

    if (!name || !email || !message || !service) {
      return NextResponse.json(
        { error: "Alle Pflichtfelder müssen ausgefüllt werden." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Bitte geben Sie eine gültige E-Mail-Adresse ein." },
        { status: 400 }
      );
    }

    // Email sending would be implemented here with a service like SendGrid, AWS SES, or Resend
    if (process.env.NODE_ENV === "development") {
      console.log("Contact form submission:", {
        name,
        email,
        company: body.company || "N/A",
        phone: body.phone || "N/A",
        service,
        message,
        timestamp: new Date().toISOString(),
      });
    }

    // In production, you would:
    // 1. Send email via service like SendGrid, AWS SES, Resend, etc.
    // 2. Store in database for record-keeping
    // 3. Send confirmation email to user

    // Example with Resend (uncomment when configured):
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'kontakt@mimitech.ai',
      to: 'info@mimitech.ai',
      subject: `Neue Kontaktanfrage von ${name}`,
      html: `
        <h2>Neue Kontaktanfrage</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>E-Mail:</strong> ${email}</p>
        <p><strong>Unternehmen:</strong> ${body.company || 'Nicht angegeben'}</p>
        <p><strong>Telefon:</strong> ${body.phone || 'Nicht angegeben'}</p>
        <p><strong>Interessiert an:</strong> ${service}</p>
        <p><strong>Nachricht:</strong></p>
        <p>${message}</p>
      `,
    });
    */

    // Real implementation using Resend HTTP API via fetch
    const env = (value?: string) => (typeof value === "string" ? value.trim() : undefined);

    const RESEND_API_KEY = env(process.env.RESEND_API_KEY);
    const CONTACT_TO_EMAIL = env(process.env.CONTACT_TO_EMAIL) || "info@mimitechai.com";
    const CONTACT_FROM_EMAIL =
      env(process.env.CONTACT_FROM_EMAIL) || "MiMi Tech AI <onboarding@resend.dev>";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set. E-Mail-Versand ist nicht konfiguriert.");
      return NextResponse.json(
        { error: "E-Mail-Versand ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut." },
        { status: 500 }
      );
    }

    const emailHtml = `
      <h2>Neue Kontaktanfrage</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>E-Mail:</strong> ${email}</p>
      <p><strong>Unternehmen:</strong> ${body.company || "Nicht angegeben"}</p>
      <p><strong>Telefon:</strong> ${body.phone || "Nicht angegeben"}</p>
      <p><strong>Interessiert an:</strong> ${service}</p>
      <p><strong>Nachricht:</strong></p>
      <p>${message}</p>
    `;

    const sendResendEmail = async (from: string) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from,
          to: [CONTACT_TO_EMAIL],
          reply_to: typeof email === "string" ? email.trim() : email,
          subject: `Neue Kontaktanfrage von ${name}`,
          html: emailHtml,
        }),
      });

      const text = await response.text().catch(() => "");
      return { response, text };
    };

    let fromTried = CONTACT_FROM_EMAIL;
    let { response: resendResponse, text: errorText } = await sendResendEmail(fromTried);

    if (!resendResponse.ok) {
      const shouldRetryWithOnboarding =
        fromTried !== "MiMi Tech AI <onboarding@resend.dev>" &&
        (resendResponse.status === 400 || resendResponse.status === 403) &&
        /verify|verified|domain|from/i.test(errorText);

      if (shouldRetryWithOnboarding) {
        fromTried = "MiMi Tech AI <onboarding@resend.dev>";
        ({ response: resendResponse, text: errorText } = await sendResendEmail(fromTried));
      }
    }

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendResponse.status, errorText);

      return NextResponse.json(
        {
          error: "Die E-Mail konnte nicht versendet werden. Bitte versuchen Sie es später erneut.",
          resendStatus: resendResponse.status,
          resendError: errorText,
          resendFromTried: fromTried,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Vielen Dank für Ihre Nachricht! Wir melden uns in Kürze bei Ihnen.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." },
      { status: 500 }
    );
  }
}