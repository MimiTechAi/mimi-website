import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

// SECURITY WARNING: This is a DEMO-ONLY implementation!
// DO NOT USE IN PRODUCTION without implementing proper database authentication.
// This hardcoded user will accept ANY @mimitechai.com email with the demo password.
async function getUserByEmail(email: string) {
  // Fail-safe: NEVER allow demo auth in production unless explicitly enabled
  if (process.env.NODE_ENV === "production" && !process.env.DEMO_AUTH_ENABLED) {
    console.error("[AUTH SECURITY] Demo credentials are DISABLED in production. Set DATABASE_URL and implement real user lookup.");
    throw new Error("Authentication not configured for production");
  }

  // DEMO MODE: Returns a hardcoded demo user for development/testing only
  // TODO: Replace with database query: SELECT * FROM users WHERE email = $1
  console.warn("[AUTH SECURITY] Using DEMO authentication - not suitable for production!");

  return {
    id: "1",
    name: "Demo User",
    email: email,
    // Demo password hash (DO NOT USE IN PRODUCTION)
    // This accepts a simple demo password for testing only
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S",
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // E-Mail-Validierung
        const mimitechaiEmailRegex = /^[^\s@]+@mimitechai\.com$/;
        if (!mimitechaiEmailRegex.test(credentials.email)) {
          return null;
        }

        const user = await getUserByEmail(credentials.email);
        
        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
  },
  pages: {
    signIn: "/internal/login",
  },
  secret: process.env.NEXTAUTH_SECRET || (() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_SECRET must be set in production!");
    }
    console.warn("[AUTH SECURITY] Using fallback NEXTAUTH_SECRET - NOT suitable for production!");
    return "development-secret-not-for-production-use";
  })(),
};