import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const REQUIRED_INVITE_CODE = "mustafadegirmenci";

export const authOptions: NextAuthOptions = {
  providers: [
    // 1. Normal E-posta ve Şifre ile Üyelik & Giriş
    CredentialsProvider({
      id: "credentials",
      name: "E-posta ve Şifre",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Lütfen e-posta ve şifrenizi girin.");
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          throw new Error("Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.");
        }

        if (!user.isApproved) {
          throw new Error(
            "Hesabınız için 'mustafadegirmenci' davet kodu doğrulanmamış."
          );
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Girdiğiniz şifre hatalı.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),

    // 2. Google / Gmail ile Giriş (Davet Kodu Şartlı)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Google / Gmail ile giriş yapılıyorsa davet kodu şartı kontrolü
      if (account?.provider === "google") {
        const email = user.email?.trim().toLowerCase();
        if (!email) return false;

        // Kullanıcı daha önce davet koduyla onaylanmış mı?
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser && existingUser.isApproved) {
          return true;
        }

        // Yeni Google kullanıcısı ise çerezdeki davet kodunu doğrula
        try {
          const cookieStore = await cookies();
          const inviteCookie = cookieStore
            .get("invite_code")
            ?.value?.trim()
            .toLowerCase();

          if (inviteCookie === REQUIRED_INVITE_CODE.toLowerCase()) {
            if (!existingUser) {
              await prisma.user.create({
                data: {
                  email,
                  name: user.name || null,
                  image: user.image || null,
                  isApproved: true,
                  inviteCodeUsed: REQUIRED_INVITE_CODE,
                },
              });
            } else {
              await prisma.user.update({
                where: { email },
                data: {
                  isApproved: true,
                  inviteCodeUsed: REQUIRED_INVITE_CODE,
                },
              });
            }
            return true;
          } else {
            // Davet kodu girilmemiş veya hatalı girilmiş
            return "/auth/signin?error=InvalidInviteCode";
          }
        } catch {
          return "/auth/signin?error=InvalidInviteCode";
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as { id?: string }).id =
          (token.id as string) || (token.sub as string);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
