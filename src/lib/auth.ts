import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

// Beispiel-Datenbankabfrage (in einer echten Anwendung würde dies eine echte Datenbankabfrage sein)
async function getUserByEmail(email: string) {
  // In einer echten Anwendung würden Sie hier die Datenbank abfragen
  // Beispiel für ein gehashtes Passwort: "password123" -> "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S"
  return {
    id: "1",
    name: "Max Mustermann",
    email: email,
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S", // password123
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
  secret: process.env.NEXTAUTH_SECRET,
};