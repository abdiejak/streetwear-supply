// ===== STORE CONFIGURATION =====
const STORE_CONFIG = {
    whatsappAdmin: "6281234567890", // Ganti nomor WA kamu
    rekening: {
        bank: "BCA",
        noRekening: "1234567890",   // Ganti nomor rekening
        atasNama: "NAMA TOKO ANDA" // Ganti nama
    },
    qrisImage: "images/qris.jpg",   // Ganti path QRIS kamu
    storeName: "STREETWEAR SUPPLY",
    tagline: "Elevate Your Style"
};
const BRANDS = [
    {
        name: 'Nike',
        logo: 'swoosh.png',
        description: 'Just Do It'
    },
    {
        name: 'Adidas',
        logo: 'adidas.png',
        description: 'Impossible is Nothing'
    },
    {
        name: 'Supreme',
        logo: 'supreme.png',
        description: 'Streetwear Icon'
    },
    {
        name: 'Stussy',
        logo: 'stussy.png',
        description: 'Original Streetwear'
    },
    {
        name: 'Vans',
        logo: 'vans.png',
        description: 'Off The Wall'
    },
    {
        name: 'Others',  // ← TAMBAHKAN INI
        logo: '📦',
        description: 'Other Brands'
    }
];
// ===== PRODUCTS DATA =====
const PRODUCTS = [
    {
        id: 1,
        name: "Supreme Box Logo Tee",
        brand: "Supreme",
        price: 850000,
        image: "https://i.imgur.com/qaPtAQf.png", // Ganti dengan URL gambar
        description: "Kaos Supreme original dengan Box Logo klasik. Material premium cotton, nyaman dipakai sehari-hari.",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["#000000", "#FFFFFF", "#FF0000"],
        badge: "Best Seller",
        featured: true
    },
    {
        id: 2,
        name: "Stussy Classic Stock",
        brand: "Stussy",
        price: 650000,
        image: "https://i.imgur.com/9Vkr5nC.png", // Ganti URL gambar
        description: "Kaos Stussy dengan logo klasik. Comfortable fit dengan material berkualitas tinggi.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["#000000", "#FFFFFF", "#0066CC"],
        badge: "New",
        featured: true
    },
    {
        id: 3,
        name: "Bape Camo Shark",
        brand: "Bape",
        price: 1200000,
        image: "https://i.imgur.com/BNfJJF2.png", // Ganti URL gambar
        description: "Iconic Bape Camo design. Premium quality dengan detail sempurna.",
        sizes: ["M", "L", "XL"],
        colors: ["#2D5016", "#000000"],
        badge: "Limited",
        featured: true
    },
    {
        id: 4,
        name: "Off-White Arrows",
        brand: "Off-White",
        price: 950000,
        image: "https://i.imgur.com/KDGjVG6.png", // Ganti URL gambar
        description: "Off-White signature arrows design. Streetwear premium dengan style yang bold.",
        sizes: ["S", "M", "L", "XL"],
        colors: ["#000000", "#FFFFFF"],
        badge: "Hot",
        featured: true
    }
    // ...tambahkan produk lain jika perlu
];