import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
        { status: 400 }
      );
    }

    // Simple in-memory storage (in production, you would use a database)
    // For now, we'll just log the subscription and return success
    if (process.env.NODE_ENV === 'development') {
      console.log(`New newsletter subscriber: ${email}`);
    }

    // In a real implementation, you would store this in a database
    // For demonstration purposes, we'll just return success

    return NextResponse.json(
      { message: 'Vielen Dank! Sie wurden erfolgreich angemeldet.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    );
  }
}