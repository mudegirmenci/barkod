import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Ürün bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Ürün getirme hatası:", error);
    return NextResponse.json(
      { error: "Ürün getirilirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, purchasePrice, salePrice, stock, imageUrl } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (purchasePrice !== undefined) dataToUpdate.purchasePrice = parseFloat(purchasePrice);
    if (salePrice !== undefined) dataToUpdate.salePrice = parseFloat(salePrice);
    if (stock !== undefined) dataToUpdate.stock = parseInt(stock, 10);
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: "Ürün başarıyla güncellendi.",
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error("Ürün güncelleme hatası:", error);
    return NextResponse.json(
      { error: error.message || "Ürün güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Ürün başarıyla silindi.",
    });
  } catch (error: any) {
    console.error("Ürün silme hatası:", error);
    return NextResponse.json(
      { error: "Ürün silinemedi. Satış kaydı olan ürünler silinemez." },
      { status: 500 }
    );
  }
}
