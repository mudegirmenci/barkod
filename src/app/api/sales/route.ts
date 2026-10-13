import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      sales,
    });
  } catch (error) {
    console.error("Satışları listeleme hatası:", error);
    return NextResponse.json(
      { error: "Satışlar listelenirken bir hata meydana geldi." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as {
      items: Array<{ productId: string; quantity: number; salePrice?: number }>;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Sepette en az bir ürün bulunmalıdır." },
        { status: 400 }
      );
    }

    // Prisma Transaction kullanarak stok düşürme ve satış kaydı oluşturma
    const completedSale = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalProfit = 0;
      const saleItemsToCreate: Array<{
        productId: string;
        quantity: number;
        salePrice: number;
        purchasePrice: number;
      }> = [];

      for (const cartItem of items) {
        const product = await tx.product.findUnique({
          where: { id: cartItem.productId },
        });

        if (!product) {
          throw new Error(`Ürün bulunamadı (ID: ${cartItem.productId})`);
        }

        const qty = Math.max(1, parseInt(String(cartItem.quantity), 10) || 1);
        const currentSalePrice =
          cartItem.salePrice !== undefined && cartItem.salePrice !== null
            ? parseFloat(String(cartItem.salePrice))
            : product.salePrice;
        const currentPurchasePrice = product.purchasePrice;

        // Stok miktarını düş
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: {
              decrement: qty,
            },
          },
        });

        const lineTotal = currentSalePrice * qty;
        const lineProfit = (currentSalePrice - currentPurchasePrice) * qty;

        totalAmount += lineTotal;
        totalProfit += lineProfit;

        saleItemsToCreate.push({
          productId: product.id,
          quantity: qty,
          salePrice: currentSalePrice,
          purchasePrice: currentPurchasePrice,
        });
      }

      // Satış fişi ve kalemlerini oluştur
      const sale = await tx.sale.create({
        data: {
          totalAmount: Math.round(totalAmount * 100) / 100,
          totalProfit: Math.round(totalProfit * 100) / 100,
          items: {
            create: saleItemsToCreate,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return sale;
    });

    return NextResponse.json({
      success: true,
      message: "Satış başarıyla tamamlandı ve stoklar güncellendi.",
      sale: completedSale,
    });
  } catch (error: any) {
    console.error("Satış tamamlama hatası:", error);
    return NextResponse.json(
      { error: error.message || "Satış kaydedilirken bir hata meydana geldi." },
      { status: 500 }
    );
  }
}
