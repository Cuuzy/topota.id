import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Clock, 
  Trees, 
  MapPin, 
  Phone, 
  Mail, 
  Lock, 
  ShoppingBag, 
  AlertTriangle,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Check
} from "lucide-react";
import { Product, LandingContent, UserRole } from "../types";
import { subscribeToLandingContent, subscribeToProducts, findUserProfileByEmail, addFeedback } from "../lib/dbService";
import PaymentModal from "./PaymentModal";
import LazyImage from "./LazyImage";

interface LandingPageProps {
  onOpenAdmin: (role: UserRole, userEmail: string, userName: string) => void;
}

export default function LandingPage({ onOpenAdmin }: LandingPageProps) {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedProductForPay, setSelectedProductForPay] = useState<Product | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Login credentials state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Contact Form states
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSubject, setContactSubject] = useState("Tanya Menu / Pemesanan");
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState("");

  // Load real-time Firestore subscriptions
  useEffect(() => {
    const unsubContent = subscribeToLandingContent((data) => {
      setContent(data);
    });

    const unsubProducts = subscribeToProducts((data) => {
      setProducts(data);
    });

    return () => {
      unsubContent();
      unsubProducts();
    };
  }, []);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Trees":
        return <Trees className="w-6 h-6 text-neutral-800" />;
      case "Sparkles":
        return <Sparkles className="w-6 h-6 text-neutral-800" />;
      case "Clock":
        return <Clock className="w-6 h-6 text-neutral-800" />;
      default:
        return <Sparkles className="w-6 h-6 text-neutral-800" />;
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    setIsLoginModalOpen(false);
    const demoUsers = {
      admin: { email: "admin@topota.id", name: "Siti Aminah (Admin)" },
      manager: { email: "manager@topota.id", name: "Joko Widodo (Manager)" },
      viewer: { email: "viewer@topota.id", name: "Toni Stark (Viewer)" }
    };
    onOpenAdmin(role, demoUsers[role].email, demoUsers[role].name);
  };

  const handleRealLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const dbUser = await findUserProfileByEmail(loginEmail);
      if (dbUser) {
        onOpenAdmin(dbUser.role, dbUser.email, dbUser.displayName);
        setIsLoginModalOpen(false);
        setLoginLoading(false);
        return;
      }
    } catch (err) {
      console.warn("DB user lookup failed, falling back to static rules", err);
    }

    // Standard demo checks for demonstration or direct accounts
    setTimeout(() => {
      if (loginEmail === "sucipto.officiall@gmail.com") {
        onOpenAdmin("admin", "sucipto.officiall@gmail.com", "Sucipto (Super Admin)");
        setIsLoginModalOpen(false);
      } else if (loginEmail === "admin@topota.id" && loginPassword === "admin123") {
        onOpenAdmin("admin", "admin@topota.id", "Siti Aminah (Admin)");
        setIsLoginModalOpen(false);
      } else if (loginEmail === "manager@topota.id" && loginPassword === "manager123") {
        onOpenAdmin("manager", "manager@topota.id", "Joko Widodo (Manager)");
        setIsLoginModalOpen(false);
      } else if (loginEmail === "viewer@topota.id" && loginPassword === "viewer123") {
        onOpenAdmin("viewer", "viewer@topota.id", "Toni Stark (Viewer)");
        setIsLoginModalOpen(false);
      } else {
        // Simple mock signin if credentials don't match, or dynamically create an viewer account
        if (loginEmail.includes("admin")) {
          onOpenAdmin("admin", loginEmail, loginEmail.split("@")[0] + " (Admin)");
          setIsLoginModalOpen(false);
        } else if (loginEmail.includes("manager")) {
          onOpenAdmin("manager", loginEmail, loginEmail.split("@")[0] + " (Manager)");
          setIsLoginModalOpen(false);
        } else if (loginEmail && loginPassword.length >= 6) {
          // Default role is viewer for standard login
          onOpenAdmin("viewer", loginEmail, loginEmail.split("@")[0] + " (Viewer)");
          setIsLoginModalOpen(false);
        } else {
          setLoginError("Email/password salah. Coba gunakan tombol Demo Login di bawah atau gunakan 'admin@topota.id' & 'admin123'.");
        }
      }
      setLoginLoading(false);
    }, 800);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError("");
    setContactSuccess(false);

    try {
      if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
        throw new Error("Mohon lengkapi nama, email, dan isi pesan Anda.");
      }

      await addFeedback({
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
        subject: contactSubject,
        message: contactMessage.trim()
      });

      setContactSuccess(true);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactSubject("Tanya Menu / Pemesanan");
      setContactMessage("");
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
      setContactError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim pesan. Coba lagi.");
    } finally {
      setContactLoading(false);
    }
  };

  if (!content) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-neutral-500 font-sans">Memuat Layanan topota.id...</p>
      </div>
    );
  }

  // Get unique product categories
  const categories = ["Semua", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = selectedCategory === "Semua" 
    ? products 
    : products.filter((p) => p.category === selectedCategory);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* Navigation */}
      <nav id="navbar" className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-neutral-100 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-neutral-900">
              {content.brandName}
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <a href="#koleksi" className="hover:text-neutral-900 transition">Koleksi</a>
            <a href="#tentang" className="hover:text-neutral-900 transition">Tentang Kami</a>
            <a href="#hubungi" className="hover:text-neutral-900 transition">Hubungi Kami</a>
          </div>

          {/* Right Action */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 border border-neutral-200 hover:border-neutral-950 hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 font-semibold px-4.5 py-2 rounded-xl text-xs tracking-wide transition uppercase"
            >
              <Lock className="w-3.5 h-3.5" />
              Admin Dashboard
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 rounded-lg text-neutral-600 hover:bg-neutral-100 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-neutral-100 px-6 py-5 space-y-4 shadow-inner">
            <div className="flex flex-col gap-4 text-sm font-medium text-neutral-600">
              <a 
                href="#koleksi" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-neutral-900 transition"
              >
                Koleksi
              </a>
              <a 
                href="#tentang" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-neutral-900 transition"
              >
                Tentang Kami
              </a>
              <a 
                href="#hubungi" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-neutral-900 transition"
              >
                Hubungi Kami
              </a>
            </div>
            <div className="pt-4 border-t border-neutral-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 border border-neutral-200 hover:border-neutral-950 hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 font-semibold px-4.5 py-2.5 rounded-xl text-xs tracking-wide transition uppercase"
              >
                <Lock className="w-3.5 h-3.5" />
                Admin Dashboard
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center bg-neutral-950 text-white overflow-hidden py-16 md:py-24">
        {/* Background Image with elegant overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={content.heroImageUrl} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-35 filter scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-8 lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-neutral-200 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Kuliner Cita Rasa Nusantara
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white">
              {content.heroTitle}
            </h1>
            <p className="text-neutral-300 text-base md:text-lg leading-relaxed max-w-2xl font-light">
              {content.heroSubtitle}
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <a 
                href="#koleksi" 
                className="inline-flex items-center gap-2 bg-white text-neutral-950 hover:bg-neutral-100 font-semibold px-7 py-3.5 rounded-xl text-sm transition shadow-md"
              >
                {content.ctaText}
                <ChevronRight className="w-4 h-4" />
              </a>
              <a 
                href="#tentang" 
                className="inline-flex items-center bg-white/15 hover:bg-white/20 text-white font-medium px-6 py-3.5 rounded-xl text-sm transition border border-white/15"
              >
                Kisah Kami
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Unique Selling Points (Features) Section */}
      <section className="py-16 md:py-24 bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {content.features.map((feature, idx) => (
              <div key={feature.id} className="space-y-4 group">
                <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition duration-300 border border-neutral-100">
                  {getIconComponent(feature.icon)}
                </div>
                <h3 className="font-serif text-xl font-bold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Collection Section */}
      <section id="koleksi" className="py-16 md:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">
                Menu Makanan Terfavorit
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-neutral-950 tracking-tight">
                Sajian Kehangatan Rasa Terbaik
              </h2>
              <p className="text-neutral-500 text-sm max-w-xl font-light">
                Pilih dari kurasi hidangan makanan utama, camilan manis lezat, dan minuman penyegar koki kami. Diproses higienis dari bahan-bahan segar harian pilihan.
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition border uppercase ${
                    selectedCategory === category
                      ? "bg-neutral-950 border-neutral-950 text-white shadow-sm"
                      : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100 shadow-sm">
              <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-neutral-500">Belum ada produk untuk kategori ini.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock === 0;
                const isLowStock = !isOutOfStock && product.stock <= product.lowStockThreshold;

                return (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-2xl border border-neutral-100 overflow-hidden flex flex-col group hover:shadow-lg transition duration-300"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-4/3 overflow-hidden bg-neutral-100">
                      <LazyImage 
                        src={product.imageUrl} 
                        alt={product.name}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      
                      {/* Product Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                        <span className="px-3 py-1 text-[10px] font-bold text-neutral-900 bg-white/90 backdrop-blur-sm rounded-full tracking-wider uppercase border border-neutral-100 shadow-sm">
                          {product.category}
                        </span>
                        {isOutOfStock && (
                          <span className="px-3 py-1 text-[10px] font-bold text-white bg-red-600 rounded-full tracking-wider uppercase shadow-sm flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Stok Habis
                          </span>
                        )}
                        {isLowStock && (
                          <span className="px-3 py-1 text-[10px] font-bold text-amber-800 bg-amber-200 rounded-full tracking-wider uppercase shadow-sm flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Stok Terbatas!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description Area */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="font-serif text-lg font-bold text-neutral-900 group-hover:text-neutral-800 transition">
                          {product.name}
                        </h3>
                        <p className="text-neutral-500 text-xs leading-relaxed font-light line-clamp-3">
                          {product.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider">
                            Harga
                          </p>
                          <p className="font-bold text-neutral-950 text-base">
                            {formatRupiah(product.price)}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => setSelectedProductForPay(product)}
                          disabled={isOutOfStock}
                          className={`inline-flex items-center gap-1.5 font-semibold px-4.5 py-2 rounded-xl text-xs tracking-wider uppercase transition border ${
                            isOutOfStock
                              ? "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
                              : "bg-neutral-950 hover:bg-neutral-800 text-white border-neutral-950 hover:border-neutral-800 shadow-sm"
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Beli
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-16 md:py-24 bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
          
          <div className="md:col-span-6 relative aspect-video md:aspect-square rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-100 shadow-md">
            <LazyImage 
              src={content.aboutImageUrl} 
              alt="Kisah Kelezatan topota.id" 
              containerClassName="w-full h-full"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="md:col-span-6 space-y-5">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">
              Kisah topota.id
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-neutral-950 tracking-tight">
              Cita Rasa Tradisional Nusantara dengan Sentuhan Modern
            </h2>
            <div className="border-l-2 border-neutral-900 pl-4 py-1">
              <p className="text-neutral-600 text-sm md:text-base leading-relaxed font-light italic">
                &ldquo;Kami tidak hanya menyajikan makanan, kami mengukir kebahagiaan di setiap gigitan masakan khas Indonesia yang kaya bumbu dan diolah sepenuh hati.&rdquo;
              </p>
            </div>
            <p className="text-neutral-500 text-sm leading-relaxed font-light">
              {content.aboutText}
            </p>
          </div>

        </div>
      </section>

      {/* Contact Section */}
      <section id="hubungi" className="py-16 md:py-24 bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12">
          
          <div className="md:col-span-5 space-y-6">
            <h2 className="font-serif text-3xl font-bold text-white tracking-tight">
              Mari Berkolaborasi
            </h2>
            <p className="text-neutral-400 text-sm font-light max-w-sm">
              Ingin memesan katering untuk acara spesial, berkolaborasi bisnis kuliner, atau sekadar bertanya mengenai menu kami? Hubungi kami langsung.
            </p>
            
            <div className="space-y-4 text-sm text-neutral-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                <p className="font-light">{content.contactAddress}</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-neutral-400 shrink-0" />
                <p className="font-light">{content.contactPhone}</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-neutral-400 shrink-0" />
                <p className="font-light">{content.contactEmail}</p>
              </div>
            </div>
          </div>

          {/* Customer Feedback Form Module */}
          <div id="contact-feedback-form" className="md:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
            <h3 className="font-serif text-xl font-bold text-white">Hubungi Kami / Kirim Pesan</h3>
            
            {contactSuccess ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl space-y-3 flex flex-col items-center text-center animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-white">Pesan Berhasil Terkirim!</h4>
                <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                  Terima kasih telah menghubungi kami. Pesan Anda telah terekam dalam sistem CRM kami (Customer Feedback) dan tim kami akan segera menghubungi Anda melalui email atau telepon.
                </p>
                <button
                  onClick={() => setContactSuccess(false)}
                  className="mt-2 text-xs font-bold text-white hover:underline uppercase tracking-wider"
                >
                  Kirim Pesan Lainnya
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                {contactError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
                    {contactError}
                  </div>
                )}
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white text-sm text-white placeholder-neutral-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Alamat Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white text-sm text-white placeholder-neutral-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Nomor Telepon / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white text-sm text-white placeholder-neutral-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Perihal / Subjek
                    </label>
                    <select
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white text-sm text-white placeholder-neutral-500 transition-all duration-200"
                    >
                      <option value="Tanya Menu / Pemesanan">Tanya Menu / Pemesanan</option>
                      <option value="Katering Acara / Event">Katering Acara / Event</option>
                      <option value="Kemitraan / Franchise">Kemitraan / Franchise</option>
                      <option value="Kritik & Saran Layanan">Kritik & Saran Layanan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Isi Pesan / Detail Pertanyaan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Tuliskan pesan atau detail pesanan Anda di sini..."
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white text-sm text-white placeholder-neutral-500 transition-all duration-200 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full bg-white hover:bg-neutral-200 text-neutral-950 font-semibold py-3 px-6 rounded-xl text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {contactLoading ? (
                      <span className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin"></span>
                    ) : (
                      "Kirim Pesan"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* Footer copyright */}
      <footer className="bg-neutral-900 border-t border-white/5 py-8 text-center text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto px-6">
          <p>&copy; {new Date().getFullYear()} {content.brandName} Indonesia. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div>
                <h3 className="font-serif text-lg font-bold text-neutral-950">
                  Login ke Dasbor Admin
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Gunakan hak akses Anda untuk mengelola konten dan inventaris
                </p>
              </div>
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {loginError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold leading-relaxed">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleRealLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@topota.id"
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800/10 focus:border-neutral-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Kata Sandi
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800/10 focus:border-neutral-800 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-neutral-950 hover:bg-neutral-800 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Masuk dengan Kredensial
                    </>
                  )}
                </button>
              </form>

              {/* Demo Login Shortcuts */}
              <div className="space-y-3 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Akses Demo Langsung (Tanpa Registrasi)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleDemoLogin("admin")}
                    className="p-2 border border-neutral-200 hover:border-red-500 hover:bg-red-50/20 text-neutral-700 hover:text-red-600 rounded-xl transition text-center"
                  >
                    <p className="text-xs font-bold">Admin</p>
                    <p className="text-[9px] text-neutral-400">Semua Fitur</p>
                  </button>

                  <button
                    onClick={() => handleDemoLogin("manager")}
                    className="p-2 border border-neutral-200 hover:border-amber-600 hover:bg-amber-50/20 text-neutral-700 hover:text-amber-600 rounded-xl transition text-center"
                  >
                    <p className="text-xs font-bold">Manager</p>
                    <p className="text-[9px] text-neutral-400">Edit Produk</p>
                  </button>

                  <button
                    onClick={() => handleDemoLogin("viewer")}
                    className="p-2 border border-neutral-200 hover:border-blue-600 hover:bg-blue-50/20 text-neutral-700 hover:text-blue-600 rounded-xl transition text-center"
                  >
                    <p className="text-xs font-bold">Viewer</p>
                    <p className="text-[9px] text-neutral-400">Lihat-Lihat</p>
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 text-center leading-relaxed font-light">
                  Demo login di atas mensimulasikan sistem keamanan berbasis peran (RBAC). <strong>Admin</strong> memiliki kendali penuh, <strong>Manager</strong> mengelola produk, dan <strong>Viewer</strong> hanya melihat data.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal Trigger */}
      {selectedProductForPay && (
        <PaymentModal 
          product={selectedProductForPay}
          onClose={() => setSelectedProductForPay(null)}
          onSuccess={() => {
            setSelectedProductForPay(null);
          }}
        />
      )}

    </div>
  );
}
