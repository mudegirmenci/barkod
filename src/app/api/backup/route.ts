import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // 1. Tüm ürünleri çek
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "asc" },
    });

    // 2. Tüm satışları ve kalemlerini çek
    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                barcode: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const backupPayload = {
      app: "EsnafPOS",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      metadata: {
        totalProducts: products.length,
        totalSales: sales.length,
      },
      products: products.map((p) => ({
        barcode: p.barcode,
        name: p.name,
        purchasePrice: p.purchasePrice,
        salePrice: p.salePrice,
        stock: p.stock,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      sales: sales.map((s) => ({
        id: s.id,
        totalAmount: s.totalAmount,
        totalProfit: s.totalProfit,
        createdAt: s.createdAt,
        items: s.items.map((item) => ({
          productBarcode: item.product.barcode,
          quantity: item.quantity,
          salePrice: item.salePrice,
          purchasePrice: item.purchasePrice,
        })),
      })),
    };

    const fileName = `esnafpos-yedek-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Yedek alma hatası:", error);
    return NextResponse.json(
      { error: "Veritabanı yedeği alınırken bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode = "merge", backupData } = body;

    const dataToImport = backupData || body;

    // Ürün listesini tespit et (ister tam EsnafPOS formatı, ister doğrudan ürün dizisi olsun)
    let rawProducts: any[] = [];
    let rawSales: any[] = [];

    if (Array.isArray(dataToImport)) {
      rawProducts = dataToImport;
    } else if (dataToImport && typeof dataToImport === "object") {
      if (Array.isArray(dataToImport.products)) {
        rawProducts = dataToImport.products;
      }
      if (Array.isArray(dataToImport.sales)) {
        rawSales = dataToImport.sales;
      }
    }

    if (rawProducts.length === 0 && rawSales.length === 0) {
      return NextResponse.json(
        {
          error:
            "Geçersiz yedek dosyası. Yüklenecek ürün veya satış verisi bulunamadı.",
        },
        { status: 400 }
      );
    }

    let importedProductsCount = 0;
    let updatedProductsCount = 0;
    let importedSalesCount = 0;

    await prisma.$transaction(async (tx) => {
      // "replace" modu seçilmişse mevcut satış ve ürünleri temizle
      if (mode === "replace") {
        await tx.saleItem.deleteMany({});
        await tx.sale.deleteMany({});
        await tx.product.deleteMany({});
      }

      // 1. Ürünleri içe aktar / güncelle
      for (const item of rawProducts) {
        if (!item.barcode || !item.name) continue;

        const barcode = String(item.barcode).trim();
        const name = String(item.name).trim();
        const purchasePrice = parseFloat(String(item.purchasePrice)) || 0;
        const salePrice = parseFloat(String(item.salePrice)) || 0;
        const stock = parseInt(String(item.stock), 10) || 500;
        const imageUrl = item.imageUrl || null;

        const existing = await tx.product.findUnique({
          where: { barcode },
        });

        if (existing) {
          await tx.product.update({
            where: { barcode },
            data: {
              name,
              purchasePrice,
              salePrice,
              stock,
              imageUrl: imageUrl || existing.imageUrl,
            },
          });
          updatedProductsCount++;
        } else {
          await tx.product.create({
            data: {
              barcode,
              name,
              purchasePrice,
              salePrice,
              stock,
              imageUrl,
            },
          });
          importedProductsCount++;
        }
      }

      // 2. Satış kayıtları varsa içe aktar
      for (const saleData of rawSales) {
        if (!saleData.items || !Array.isArray(saleData.items)) continue;

        const totalAmount = parseFloat(String(saleData.totalAmount)) || 0;
        const totalProfit = parseFloat(String(saleData.totalProfit)) || 0;
        const createdAt = saleData.createdAt ? new Date(saleData.createdAt) : new Date();

        const saleItemsToCreate: Array<{
          productId: string;
          quantity: number;
          salePrice: number;
          purchasePrice: number;
        }> = [];

        for (const line of saleData.items) {
          if (!line.productBarcode) continue;
          const product = await tx.product.findUnique({
            where: { barcode: String(line.productBarcode).trim() },
          });

          if (product) {
            saleItemsToCreate.push({
              productId: product.id,
              quantity: parseInt(String(line.quantity), 10) || 1,
              salePrice: parseFloat(String(line.salePrice)) || product.salePrice,
              purchasePrice: parseFloat(String(line.purchasePrice)) || product.purchasePrice,
            });
          }
        }

        if (saleItemsToCreate.length > 0) {
          await tx.sale.create({
            data: {
              totalAmount,
              totalProfit,
              createdAt,
              items: {
                create: saleItemsToCreate,
              },
            },
          });
          importedSalesCount++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Veritabanı başarıyla geri yüklendi! (${importedProductsCount} yeni ürün eklendi, ${updatedProductsCount} ürün güncellendi, ${importedSalesCount} satış aktarıldı).`,
      summary: {
        newProducts: importedProductsCount,
        updatedProducts: updatedProductsCount,
        importedSales: importedSalesCount,
      },
    });
  } catch (error: any) {
    console.error("Yedek geri yükleme hatası:", error);
    return NextResponse.json(
      { error: error.message || "Yedek dosyası geri yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
