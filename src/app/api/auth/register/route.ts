import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export const REQUIRED_INVITE_CODE = "mustafadegirmenci";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, inviteCode } = body;

    // 1. ZORUNLU DAVET KODU KONTROLÜ
    const cleanedInviteCode = (inviteCode || "").trim().toLowerCase();
    if (cleanedInviteCode !== REQUIRED_INVITE_CODE.toLowerCase()) {
      return NextResponse.json(
        {
          error:
            "Geçersiz veya eksik davet kodu! Üyelik işlemlerinin tamamlanabilmesi için 'mustafadegirmenci' davet kodu zorunludur.",
        },
        { status: 400 }
      );
    }

    // 2. Alan Kontrolleri
    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre alanları zorunludur." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifreniz en az 6 karakter uzunluğunda olmalıdır." },
        { status: 400 }
      );
    }

    // 3. E-posta daha önce kayıt edilmiş mi kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut." },
        { status: 400 }
      );
    }

    // 4. Şifreyi bcrypt ile hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Yeni kullanıcı oluştur
    const newUser = await prisma.user.create({
      data: {
        name: name ? name.trim() : null,
        email: cleanEmail,
        password: hashedPassword,
        isApproved: true,
        inviteCodeUsed: REQUIRED_INVITE_CODE,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Kayıt hatası:", error);
    return NextResponse.json(
      { error: error.message || "Kayıt işlemi sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
