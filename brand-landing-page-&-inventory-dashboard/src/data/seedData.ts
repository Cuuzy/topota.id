import { Product, Transaction, LandingContent } from "../types";

export const defaultLandingContent: LandingContent = {
  brandName: "topota.id",
  heroTitle: "Kelezatan Rasa Nusantara & Modern yang Bikin Nagih!",
  heroSubtitle: "Menyajikan makanan hangat siap saji, camilan manis lezat, hingga kopi aren segar dari bahan pilihan terbaik. Diproses higienis untuk keceriaan makan Anda setiap hari.",
  heroImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
  aboutText: "topota.id didirikan dari kecintaan mendalam pada cita rasa kuliner Indonesia yang kaya berpadu dengan standar kualitas kuliner modern. Kami percaya bahwa makanan lezat bukan hanya sekadar mengenyangkan, melainkan jembatan kehangatan yang menyatukan tawa di setiap meja makan. Menggunakan bahan-bahan lokal pilihan dari pemasok terpercaya, diolah dengan higienis, kami hadir menyajikan hidangan berkualitas terbaik dengan harga bersahabat langsung untuk Anda.",
  aboutImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  ctaText: "Pesan Menu Sekarang",
  contactEmail: "halo@topota.id",
  contactPhone: "+62 811-9876-5432",
  contactAddress: "Ruko Gading Boulevard Blok TB-2 No. 12, Kelapa Gading, Jakarta Utara, 14240",
  features: [
    {
      id: "f1",
      title: "Bahan Segar Pilihan",
      description: "Kami hanya menggunakan daging segar kualitas premium dan sayuran segar harian bebas pestisida.",
      icon: "Sparkles"
    },
    {
      id: "f2",
      title: "Higienis & Sehat",
      description: "Diproses dengan protokol kebersihan super ketat serta disajikan dengan kemasan food-grade yang ramah lingkungan.",
      icon: "ShieldCheck"
    },
    {
      id: "f3",
      title: "Pengantaran Cepat",
      description: "Sistem logistik yang efisien demi memastikan hidangan tiba di tangan Anda dalam kondisi hangat dan segar.",
      icon: "Clock"
    }
  ]
};

export const defaultProducts: Product[] = [
  {
    id: "prod-1",
    name: "Nasi Goreng Spesial Topota",
    description: "Nasi goreng premium khas Topota dengan bumbu rempah nusantara otentik, telur mata sapi, suwiran dada ayam empuk, acar segar, dan kerupuk renyah.",
    price: 35000,
    stock: 50,
    lowStockThreshold: 10,
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=800&q=80",
    category: "Makanan Utama",
    soldCount: 120,
    createdAt: "2026-04-10T08:00:00Z",
    updatedAt: "2026-07-10T12:00:00Z"
  },
  {
    id: "prod-2",
    name: "Bakso Sapi Kuah Kaldu",
    description: "Bakso sapi halus premium dengan kuah kaldu sapi gurih buatan sendiri, disajikan lengkap dengan bihun, mi kuning, sayur sawi segar, dan taburan bawang goreng harum.",
    price: 28000,
    stock: 40,
    lowStockThreshold: 8,
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    category: "Makanan Utama",
    soldCount: 85,
    createdAt: "2026-04-12T09:00:00Z",
    updatedAt: "2026-07-08T15:30:00Z"
  },
  {
    id: "prod-3",
    name: "Es Kopi Susu Aren",
    description: "Espresso arabika pilihan berpadu sempurna dengan susu segar creamy dan sirup gula aren murni. Es kopi susu kekinian penambah semangat harian Anda.",
    price: 18000,
    stock: 100,
    lowStockThreshold: 15,
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
    category: "Minuman",
    soldCount: 340,
    createdAt: "2026-04-15T10:00:00Z",
    updatedAt: "2026-07-11T10:15:00Z"
  },
  {
    id: "prod-4",
    name: "Croissant Mentega Perancis",
    description: "Pastry mentega impor klasik Perancis yang garing di luar, sangat flaky, lembut, dan harum di dalam. Dipanggang segar setiap pagi.",
    price: 22000,
    stock: 25,
    lowStockThreshold: 5,
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
    category: "Camilan",
    soldCount: 90,
    createdAt: "2026-04-18T11:00:00Z",
    updatedAt: "2026-07-09T09:00:00Z"
  },
  {
    id: "prod-5",
    name: "Sate Ayam Bumbu Kacang",
    description: "10 tusuk sate ayam dada empuk tanpa lemak dibakar dengan arang batok kelapa, disiram saus kacang gurih manis khas Madura, kecap manis, dan irisan bawang merah.",
    price: 32000,
    stock: 30,
    lowStockThreshold: 10,
    imageUrl: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80",
    category: "Makanan Utama",
    soldCount: 150,
    createdAt: "2026-04-20T12:00:00Z",
    updatedAt: "2026-07-05T14:20:00Z"
  },
  {
    id: "prod-6",
    name: "Martabak Manis Cokelat Keju",
    description: "Martabak manis tebal berpori lembut dengan olesan mentega premium, taburan butiran cokelat manis, dan limpahan keju parut cheddar yang gurih manis.",
    price: 45000,
    stock: 15,
    lowStockThreshold: 5,
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    category: "Camilan",
    soldCount: 75,
    createdAt: "2026-04-25T14:00:00Z",
    updatedAt: "2026-07-12T06:00:00Z"
  }
];

export const defaultTransactions: Transaction[] = [
  {
    id: "trx-101",
    items: [
      { productId: "prod-1", name: "Nasi Goreng Spesial Topota", quantity: 2, priceAtSale: 35000 }
    ],
    totalAmount: 70000,
    customerName: "Budi Santoso",
    customerEmail: "budi.santoso@gmail.com",
    paymentMethod: "Bank Transfer (Virtual Account)",
    paymentStatus: "success",
    date: "2026-05-02T10:15:00Z"
  },
  {
    id: "trx-102",
    items: [
      { productId: "prod-3", name: "Es Kopi Susu Aren", quantity: 2, priceAtSale: 18000 },
      { productId: "prod-4", name: "Croissant Mentega Perancis", quantity: 1, priceAtSale: 22000 }
    ],
    totalAmount: 58000,
    customerName: "Siti Rahma",
    customerEmail: "siti.rahma@yahoo.com",
    paymentMethod: "GoPay / QRIS",
    paymentStatus: "success",
    date: "2026-05-15T14:30:00Z"
  },
  {
    id: "trx-103",
    items: [
      { productId: "prod-5", name: "Sate Ayam Bumbu Kacang", quantity: 1, priceAtSale: 32000 }
    ],
    totalAmount: 32000,
    customerName: "Aditya Wijaya",
    customerEmail: "adit.wijaya@outlook.com",
    paymentMethod: "Credit Card",
    paymentStatus: "success",
    date: "2026-05-28T11:45:00Z"
  },
  {
    id: "trx-104",
    items: [
      { productId: "prod-6", name: "Martabak Manis Cokelat Keju", quantity: 1, priceAtSale: 45000 },
      { productId: "prod-3", name: "Es Kopi Susu Aren", quantity: 1, priceAtSale: 18000 }
    ],
    totalAmount: 63000,
    customerName: "Dewi Lestari",
    customerEmail: "dewi.lestari@gmail.com",
    paymentMethod: "GoPay / QRIS",
    paymentStatus: "success",
    date: "2026-06-05T09:20:00Z"
  },
  {
    id: "trx-105",
    items: [
      { productId: "prod-2", name: "Bakso Sapi Kuah Kaldu", quantity: 2, priceAtSale: 28000 }
    ],
    totalAmount: 56000,
    customerName: "Rian Hidayat",
    customerEmail: "rian.h@gmail.com",
    paymentMethod: "Bank Transfer (Virtual Account)",
    paymentStatus: "success",
    date: "2026-06-12T16:10:00Z"
  },
  {
    id: "trx-106",
    items: [
      { productId: "prod-1", name: "Nasi Goreng Spesial Topota", quantity: 1, priceAtSale: 35000 },
      { productId: "prod-3", name: "Es Kopi Susu Aren", quantity: 1, priceAtSale: 18000 }
    ],
    totalAmount: 53000,
    customerName: "Maya Putri",
    customerEmail: "maya.putri@hotmail.com",
    paymentMethod: "GoPay / QRIS",
    paymentStatus: "success",
    date: "2026-06-22T13:40:00Z"
  },
  {
    id: "trx-107",
    items: [
      { productId: "prod-5", name: "Sate Ayam Bumbu Kacang", quantity: 2, priceAtSale: 32000 }
    ],
    totalAmount: 64000,
    customerName: "Hendri Kartiko",
    customerEmail: "hendri.k@gmail.com",
    paymentMethod: "Credit Card",
    paymentStatus: "success",
    date: "2026-06-29T10:05:00Z"
  },
  {
    id: "trx-108",
    items: [
      { productId: "prod-1", name: "Nasi Goreng Spesial Topota", quantity: 3, priceAtSale: 35000 }
    ],
    totalAmount: 105000,
    customerName: "Andi Pratama",
    customerEmail: "andi.pratama@gmail.com",
    paymentMethod: "GoPay / QRIS",
    paymentStatus: "success",
    date: "2026-07-02T11:30:00Z"
  },
  {
    id: "trx-109",
    items: [
      { productId: "prod-2", name: "Bakso Sapi Kuah Kaldu", quantity: 1, priceAtSale: 28000 },
      { productId: "prod-3", name: "Es Kopi Susu Aren", quantity: 2, priceAtSale: 18000 }
    ],
    totalAmount: 64000,
    customerName: "Kurniawati",
    customerEmail: "kurnia@outlook.com",
    paymentMethod: "Bank Transfer (Virtual Account)",
    paymentStatus: "success",
    date: "2026-07-08T15:20:00Z"
  },
  {
    id: "trx-110",
    items: [
      { productId: "prod-6", name: "Martabak Manis Cokelat Keju", quantity: 2, priceAtSale: 45000 }
    ],
    totalAmount: 90000,
    customerName: "Fajar Nugraha",
    customerEmail: "fajar.nug@gmail.com",
    paymentMethod: "GoPay / QRIS",
    paymentStatus: "success",
    date: "2026-07-11T17:45:00Z"
  }
];
