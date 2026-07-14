import React, { useState } from "react";
import { X, QrCode, CreditCard, Landmark, Smartphone, Check, Loader2 } from "lucide-react";
import { Product, TransactionItem } from "../types";
import { createTransaction } from "../lib/dbService";

interface PaymentModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ product, onClose, onSuccess }: PaymentModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "gopay" | "va_bca" | "credit_card">("qris");
  const [step, setStep] = useState<"info" | "pay" | "processing" | "success">("info");
  const [errorMessage, setErrorMessage] = useState("");
  const [vaNumber, setVaNumber] = useState("");

  const priceAtSale = product.price;
  const totalAmount = priceAtSale * quantity;

  const handleNextToPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) {
      setErrorMessage("Silakan lengkapi nama dan email Anda.");
      return;
    }
    if (quantity > product.stock) {
      setErrorMessage(`Jumlah pembelian melebihi stok yang tersedia (${product.stock}).`);
      return;
    }
    setErrorMessage("");

    // Generate fake VA number if BCA VA chosen
    if (paymentMethod === "va_bca") {
      setVaNumber(`80120${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    }

    setStep("pay");
  };

  const handleProcessPayment = async () => {
    setStep("processing");
    try {
      const items: TransactionItem[] = [
        {
          productId: product.id,
          name: product.name,
          quantity: quantity,
          priceAtSale: priceAtSale
        }
      ];

      const paymentLabel = {
        qris: "QRIS GoPay/OVO/Dana",
        gopay: "GoPay E-Wallet",
        va_bca: "BCA Virtual Account",
        credit_card: "Kartu Kredit"
      }[paymentMethod];

      await createTransaction({
        items,
        totalAmount,
        customerName,
        customerEmail,
        paymentMethod: paymentLabel,
        paymentStatus: "success"
      });

      setStep("success");
    } catch (err: any) {
      setStep("pay");
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses transaksi.");
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <div>
            <h3 className="font-serif text-xl font-semibold text-neutral-900">
              {step === "success" ? "Transaksi Berhasil" : "Pembayaran Digital"}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Secure Checkout via Topota Gateway
            </p>
          </div>
          {step !== "processing" && (
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
              {errorMessage}
            </div>
          )}

          {step === "info" && (
            <form onSubmit={handleNextToPay} className="space-y-4">
              {/* Product Card Summary */}
              <div className="flex gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-16 h-16 object-cover rounded-lg bg-neutral-200"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-neutral-800 text-sm truncate">{product.name}</h4>
                  <p className="text-xs text-neutral-500 line-clamp-1">{product.category}</p>
                  <p className="text-sm font-semibold text-neutral-900 mt-1">{formatRupiah(priceAtSale)}</p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Jumlah Pembelian
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 border border-neutral-200 rounded-lg flex items-center justify-center hover:bg-neutral-50 transition font-medium"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-neutral-800">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-9 h-9 border border-neutral-200 rounded-lg flex items-center justify-center hover:bg-neutral-50 transition font-medium"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                  <span className="text-xs text-neutral-400 ml-2">
                    (Stok tersedia: {product.stock})
                  </span>
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800/10 focus:border-neutral-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Contoh: budi@gmail.com"
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800/10 focus:border-neutral-800 text-sm"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qris")}
                    className={`p-3 border rounded-xl flex items-center gap-2.5 text-left transition ${
                      paymentMethod === "qris" 
                        ? "border-neutral-950 bg-neutral-50 text-neutral-900" 
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <QrCode className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">QRIS</p>
                      <p className="text-[10px] text-neutral-400">Scan QR Code</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("gopay")}
                    className={`p-3 border rounded-xl flex items-center gap-2.5 text-left transition ${
                      paymentMethod === "gopay" 
                        ? "border-neutral-950 bg-neutral-50 text-neutral-900" 
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">GoPay</p>
                      <p className="text-[10px] text-neutral-400">Instan E-Wallet</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("va_bca")}
                    className={`p-3 border rounded-xl flex items-center gap-2.5 text-left transition ${
                      paymentMethod === "va_bca" 
                        ? "border-neutral-950 bg-neutral-50 text-neutral-900" 
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <Landmark className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">BCA VA</p>
                      <p className="text-[10px] text-neutral-400">Virtual Account</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("credit_card")}
                    className={`p-3 border rounded-xl flex items-center gap-2.5 text-left transition ${
                      paymentMethod === "credit_card" 
                        ? "border-neutral-950 bg-neutral-50 text-neutral-900" 
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">Kartu Kredit</p>
                      <p className="text-[10px] text-neutral-400">Visa / Mastercard</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Summary and Submit Button */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">Total Pembayaran</p>
                  <p className="text-lg font-bold text-neutral-950">{formatRupiah(totalAmount)}</p>
                </div>
                <button
                  type="submit"
                  className="bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition"
                >
                  Lanjutkan
                </button>
              </div>
            </form>
          )}

          {step === "pay" && (
            <div className="space-y-6 text-center py-2">
              <div className="bg-neutral-50 p-4 rounded-xl inline-block max-w-[280px] mx-auto border border-neutral-100">
                {paymentMethod === "qris" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-red-500">QRIS GPN</span>
                      <span className="text-[10px] font-mono font-medium text-neutral-400">NMID: ID102030405</span>
                    </div>
                    {/* Simulated QR Code */}
                    <div className="bg-white p-3 rounded-lg border border-neutral-200 flex items-center justify-center">
                      <div className="relative w-40 h-40 flex flex-wrap p-1">
                        {/* Custom visual grid to simulate authentic looking QR */}
                        <div className="absolute inset-0 bg-neutral-950 grid grid-cols-8 gap-0.5 p-1 bg-opacity-[0.85] rounded">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-full h-full rounded-sm ${
                                (i % 7 === 0 || i % 11 === 0 || i < 6 || i % 8 === 0 || (i > 40 && i < 48)) 
                                  ? "bg-neutral-950" 
                                  : "bg-white"
                              }`}
                            />
                          ))}
                        </div>
                        {/* QR Corners */}
                        <div className="absolute top-1.5 left-1.5 w-10 h-10 border-4 border-neutral-950 bg-white flex items-center justify-center">
                          <div className="w-4 h-4 bg-neutral-950" />
                        </div>
                        <div className="absolute top-1.5 right-1.5 w-10 h-10 border-4 border-neutral-950 bg-white flex items-center justify-center">
                          <div className="w-4 h-4 bg-neutral-950" />
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 w-10 h-10 border-4 border-neutral-950 bg-white flex items-center justify-center">
                          <div className="w-4 h-4 bg-neutral-950" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500">Scan QR menggunakan aplikasi e-wallet Anda (GoPay, OVO, Dana, LinkAja, m-Banking)</p>
                  </div>
                )}

                {paymentMethod === "gopay" && (
                  <div className="space-y-4 py-3">
                    <Smartphone className="w-16 h-16 mx-auto text-sky-500" />
                    <p className="text-sm font-semibold text-neutral-800">Menghubungkan ke Aplikasi GoPay...</p>
                    <p className="text-xs text-neutral-500">Tekan tombol di bawah untuk membuka aplikasi GoPay di ponsel Anda dan selesaikan transaksi secara instan.</p>
                  </div>
                )}

                {paymentMethod === "va_bca" && (
                  <div className="space-y-4 py-2">
                    <Landmark className="w-12 h-12 mx-auto text-blue-600" />
                    <div>
                      <p className="text-xs text-neutral-400">Nomor Virtual Account BCA</p>
                      <p className="text-lg font-mono font-bold tracking-wider text-neutral-900 mt-1 select-all bg-neutral-100 py-1.5 rounded-lg border border-neutral-200">
                        {vaNumber}
                      </p>
                    </div>
                    <div className="text-left text-[11px] text-neutral-500 space-y-1 bg-white p-2.5 rounded-lg border border-neutral-100">
                      <p className="font-semibold text-neutral-700">Langkah Transfer:</p>
                      <p>1. Pilih Transfer - BCA Virtual Account</p>
                      <p>2. Masukkan nomor VA di atas</p>
                      <p>3. Pastikan nominal transfer: <span className="font-semibold text-neutral-800">{formatRupiah(totalAmount)}</span></p>
                    </div>
                  </div>
                )}

                {paymentMethod === "credit_card" && (
                  <div className="space-y-3 py-1 text-left">
                    <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Detail Kartu Kredit</label>
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        placeholder="Nomor Kartu (4111 2222 3333 4444)" 
                        className="w-full px-3 py-1.5 border border-neutral-200 rounded text-xs focus:outline-none focus:border-neutral-900 font-mono"
                        maxLength={19}
                        defaultValue="4111 2222 3333 4444"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          className="px-3 py-1.5 border border-neutral-200 rounded text-xs focus:outline-none focus:border-neutral-900 font-mono"
                          maxLength={5}
                          defaultValue="12/28"
                        />
                        <input 
                          type="password" 
                          placeholder="CVV" 
                          className="px-3 py-1.5 border border-neutral-200 rounded text-xs focus:outline-none focus:border-neutral-900 font-mono"
                          maxLength={3}
                          defaultValue="123"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">Sistem kami menggunakan enkripsi end-to-end 256-bit standar industri perbankan demi keamanan data kartu Anda.</p>
                  </div>
                )}
              </div>

              {/* Payment Status Summary */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-2 text-left max-w-sm mx-auto">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Nama Pelanggan</span>
                  <span className="font-medium text-neutral-800">{customerName}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Produk</span>
                  <span className="font-medium text-neutral-800 truncate max-w-[180px]">{product.name} (x{quantity})</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-neutral-200 pt-2 text-neutral-900">
                  <span>Total Tagihan</span>
                  <span>{formatRupiah(totalAmount)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => setStep("info")}
                  className="px-5 py-2 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 text-sm font-medium transition"
                >
                  Kembali
                </button>
                <button
                  onClick={handleProcessPayment}
                  className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  Saya Sudah Bayar
                </button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-12 h-12 text-neutral-800 animate-spin mb-4" />
              <p className="font-medium text-neutral-800 text-base">Memverifikasi Pembayaran...</p>
              <p className="text-xs text-neutral-400 mt-1.5 max-w-[280px]">Tunggu sebentar, kami sedang memproses transaksi digital Anda secara aman dengan server.</p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border border-emerald-100 animate-pulse">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="font-serif text-2xl font-semibold text-neutral-900">Pembayaran Sukses!</h4>
              <p className="text-sm text-neutral-500 mt-2 max-w-[320px]">
                Terima kasih, <strong>{customerName}</strong>. Transaksi Anda telah berhasil diverifikasi oleh sistem. 
              </p>
              
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 w-full max-w-sm my-6 text-left space-y-1.5">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>ID Transaksi</span>
                  <span className="font-mono font-medium text-neutral-800">TRX-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Waktu Pembayaran</span>
                  <span className="font-medium text-neutral-800">{new Date().toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Total Transaksi</span>
                  <span className="font-bold text-emerald-600">{formatRupiah(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Metode</span>
                  <span className="font-medium text-neutral-800">QRIS / Instant Payment</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="w-full max-w-sm py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold transition"
              >
                Kembali Belanja
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
