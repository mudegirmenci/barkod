import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Veritabanı tohumlama (seeding) başlatılıyor...");

  // Örnek Ürünler
  const sampleProducts = [
    {
      barcode: "8690637012345",
      name: "Çaykur Rize Turist Çayı 500 gr",
      purchasePrice: 85.0,
      salePrice: 115.5,
      stock: 500, // Standart stok
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60",
    },
    {
      barcode: "8690504018231",
      name: "Eti Browni Intense Çikolatalı Kek 50 gr",
      purchasePrice: 11.0,
      salePrice: 16.5,
      stock: 8, // KRİTİK STOK ÖRNEĞİ (<= 10)
      imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60",
    },
    {
      barcode: "8690526010015",
      name: "Sütaş Tam Yağlı Süt 1 Litre",
      purchasePrice: 31.0,
      salePrice: 42.0,
      stock: 5, // KRİTİK STOK ÖRNEĞİ (<= 10)
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60",
    },
    {
      barcode: "8690576001238",
      name: "Ülker Çikolatalı Gofret 36 gr (24'lü Paket)",
      purchasePrice: 170.0,
      salePrice: 220.0,
      stock: 500,
      imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=60",
    },
    {
      barcode: "5449000000996",
      name: "Coca-Cola Orijinal Tat Kutu 330 ml",
      purchasePrice: 24.0,
      salePrice: 35.0,
      stock: 500,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60",
    },
  ];

  for (const item of sampleProducts) {
    await prisma.product.upsert({
      where: { barcode: item.barcode },
      update: {},
      create: item,
    });
  }

  console.log("Örnek ürünler eklendi.");
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
