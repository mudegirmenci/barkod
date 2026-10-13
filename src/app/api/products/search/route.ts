import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeTurkishMarketPrices } from "@/lib/market-scraper";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode")?.trim();
    const query = searchParams.get("query")?.trim();

    if (!barcode) {
      return NextResponse.json(
        { error: "Barkod parametresi zorunludur." },
        { status: 400 }
      );
    }

    // 1. Veritabanında ürün var mı kontrol et
    const existingProduct = await prisma.product.findUnique({
      where: { barcode },
    });

    if (existingProduct) {
      return NextResponse.json({
        exists: true,
        product: existingProduct,
      });
    }

    // 2. Ürün veritabanında yoksa internetten fiyat araştırması yap (Cimri, Trendyol, Akakçe vb.)
    const scrapedData = await scrapeTurkishMarketPrices(barcode, query);

    return NextResponse.json({
      exists: false,
      product: null,
      scraped: scrapedData,
    });
  } catch (error) {
    console.error("Barkod arama hatası:", error);
    return NextResponse.json(
      { error: "Ürün aranırken bir sunucu hatası meydana geldi." },
      { status: 500 }
    );
  }
}
