import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // Günün başlangıcı (00:00:00)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 7 gün öncesi
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Günlük satışlar
    const todaySales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    const dailyRevenue = todaySales.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const dailyProfit = todaySales.reduce((acc, curr) => acc + curr.totalProfit, 0);
    const dailyCount = todaySales.length;

    // 2. Haftalık satışlar
    const weeklySales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfWeek,
        },
      },
    });

    const weeklyRevenue = weeklySales.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const weeklyProfit = weeklySales.reduce((acc, curr) => acc + curr.totalProfit, 0);
    const weeklyCount = weeklySales.length;

    // 3. Kritik Stok Uyarıları (Stok miktarı 10 ve altında olan ürünler)
    const criticalStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: 10,
        },
      },
      orderBy: {
        stock: "asc",
      },
      take: 20,
    });

    // 4. Toplam ürün sayısı
    const totalProductsCount = await prisma.product.count();

    // 5. Son 5 satış hareketi
    const recentSales = await prisma.sale.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        daily: {
          revenue: Math.round(dailyRevenue * 100) / 100,
          profit: Math.round(dailyProfit * 100) / 100,
          count: dailyCount,
        },
        weekly: {
          revenue: Math.round(weeklyRevenue * 100) / 100,
          profit: Math.round(weeklyProfit * 100) / 100,
          count: weeklyCount,
        },
        totalProducts: totalProductsCount,
      },
      criticalStockProducts,
      recentSales,
    });
  } catch (error) {
    console.error("Dashboard veri çekme hatası:", error);
    return NextResponse.json(
      { error: "Dashboard verileri yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
