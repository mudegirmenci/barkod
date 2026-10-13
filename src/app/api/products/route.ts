import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const criticalOnly = searchParams.get("criticalOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (criticalOnly) {
      whereClause.stock = { lte: 10 };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: criticalOnly ? { stock: "asc" } : { updatedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Ürün listeleme hatası:", error);
    return NextResponse.json(
      { error: "Ürünler listelenirken bir hata meydana geldi." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode, name, purchasePrice, salePrice, stock, imageUrl } = body;

    if (!barcode || !name) {
      return NextResponse.json(
        { error: "Barkod ve ürün adı alanları zorunludur." },
        { status: 400 }
      );
    }

    const parsedPurchasePrice = parseFloat(purchasePrice) || 0;
    const parsedSalePrice = parseFloat(salePrice) || 0;
    const parsedStock = stock !== undefined && stock !== null ? parseInt(stock, 10) : 500;

    // Barkod benzersiz mi kontrol et
    const existing = await prisma.product.findUnique({
      where: { barcode: barcode.trim() },
    });

    if (existing) {
      // Güncelle
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          purchasePrice: parsedPurchasePrice,
          salePrice: parsedSalePrice,
          stock: parsedStock,
          imageUrl: imageUrl || existing.imageUrl,
        },
      });
      return NextResponse.json({
        success: true,
        message: "Ürün başarıyla güncellendi.",
        product: updated,
      });
    }

    // Yeni ürün oluştur
    const newProduct = await prisma.product.create({
      data: {
        barcode: barcode.trim(),
        name: name.trim(),
        purchasePrice: parsedPurchasePrice,
        salePrice: parsedSalePrice,
        stock: parsedStock,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ürün başarıyla kaydedildi.",
      product: newProduct,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Ürün ekleme hatası:", error);
    return NextResponse.json(
      { error: error.message || "Ürün kaydedilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
