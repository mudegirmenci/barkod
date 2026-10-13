import { NextRequest, NextResponse } from "next/server";
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

    const scrapedData = await scrapeTurkishMarketPrices(barcode, query);

    return NextResponse.json({
      success: true,
      data: scrapedData,
    });
  } catch (error) {
    console.error("İnternetten fiyat çekme hatası:", error);
    return NextResponse.json(
      { error: "Fiyatlar çekilirken bir hata meydana geldi." },
      { status: 500 }
    );
  }
}
