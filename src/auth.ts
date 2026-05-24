import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          credits: user.credits,
          stripeSubscriptionId: user.stripeSubscriptionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.credits = (user as any).credits;
        token.stripeSubscriptionId = (user as any).stripeSubscriptionId;
      }
      
      // Dynamically fetch latest credits & subscription status from the database
      if (token.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { credits: true, stripeSubscriptionId: true },
          });
          if (dbUser) {
            token.credits = dbUser.credits;
            token.stripeSubscriptionId = dbUser.stripeSubscriptionId;
          }
        } catch (error) {
          console.error("Error refreshing token user data from DB:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.credits = token.credits as number;
        session.user.stripeSubscriptionId = token.stripeSubscriptionId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
