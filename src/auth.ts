import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 Hari (604.800 detik)

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60, // Perbarui token saat user aktif setiap 24 jam
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.is_active) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      const now = Math.floor(Date.now() / 1000)
      if (user) {
        token.role = user.role
        token.id = user.id
        token.loginAt = now
      }

      // Validasi mutlak batas 7 hari sejak login
      if (token.loginAt && now - (token.loginAt as number) > SESSION_MAX_AGE) {
        return null
      }

      return token
    },
    session({ session, token }) {
      if (!token || !token.id) {
        return null as any
      }
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.loginAt = token.loginAt as number
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
})
