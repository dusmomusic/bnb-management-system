import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

// Definisci un tipo per l'utente con le proprietà che ci servono
type UserWithRole = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
};

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Restituisci un oggetto con le proprietà che ci servono
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role
        } as UserWithRole;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Aggiungi le proprietà personalizzate al token
        token.role = (user as UserWithRole).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Verifica che session.user esista
      if (!session.user) {
        session.user = {};
      }
      
      // Usa un approccio più diretto per costruire l'oggetto session
      return {
        ...session,
        user: {
          // Usa valori predefiniti nel caso in cui le proprietà siano undefined
          name: session.user.name || null,
          email: session.user.email || null,
          image: session.user.image || null,
          // Aggiungi le proprietà personalizzate
          role: token.role as string,
          id: token.id as string
        }
      };
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 