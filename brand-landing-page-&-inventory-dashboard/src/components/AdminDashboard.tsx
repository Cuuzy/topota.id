import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  Settings, 
  Users, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  Search, 
  Filter,
  CheckCircle,
  Shield,
  Briefcase,
  Eye,
  Settings2,
  RefreshCw,
  X,
  Database,
  Sun,
  Moon,
  Upload,
  QrCode,
  Barcode,
  Printer,
  Check,
  UserPlus,
  RotateCcw,
  Truck,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import QRCode from "qrcode";
import { generateCode39Svg } from "../lib/barcode";
import { Product, Transaction, LandingContent, UserProfile, UserRole, InventoryBackup, Supplier, RolePermissionConfig, DashboardWidget, CustomerFeedback } from "../types";
import { 
  subscribeToProducts, 
  subscribeToTransactions, 
  subscribeToLandingContent, 
  subscribeToUserProfiles,
  updateLandingContent,
  addProduct,
  updateProduct,
  deleteProduct,
  updateUserRole,
  createUserProfile,
  deleteUserProfile,
  subscribeToRolePermissions,
  updateRolePermissions,
  defaultRolePermissions,
  createInventoryBackup,
  subscribeToInventoryBackups,
  deleteInventoryBackup,
  fetchProducts,
  fetchTransactions,
  subscribeToSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  subscribeToFeedbacks,
  updateFeedback,
  deleteFeedback
} from "../lib/dbService";
import { OnboardingTour } from "./OnboardingTour";

const ALL_WIDGETS: DashboardWidget[] = [
  {
    id: "total_revenue",
    title: "Pendapatan Total",
    category: "Keuangan",
    description: "Akumulasi omset pendapatan kotor dari seluruh transaksi pembayaran sukses.",
    size: "small"
  },
  {
    id: "total_orders",
    title: "Total Transaksi",
    category: "Transaksi",
    description: "Jumlah seluruh transaksi pesanan sukses yang tercatat di database.",
    size: "small"
  },
  {
    id: "low_stock_items",
    title: "Stok Rendah",
    category: "Inventaris",
    description: "Jumlah item produk dengan stok saat ini di bawah ambang batas kritis.",
    size: "small"
  },
  {
    id: "inventory_value",
    title: "Nilai Inventaris Aktif",
    category: "Inventaris",
    description: "Total nilai aset finansial dari seluruh produk yang tersimpan di sistem.",
    size: "small"
  },
  {
    id: "total_products",
    title: "Varian Produk",
    category: "Inventaris",
    description: "Jumlah variasi produk unik yang aktif dan terdaftar di database.",
    size: "small"
  },
  {
    id: "total_suppliers",
    title: "Supplier Mitra",
    category: "Rantai Pasok",
    description: "Jumlah supplier aktif yang bekerja sama menyuplai pasokan barang.",
    size: "small"
  },
  {
    id: "top_products_list",
    title: "Produk Terlaris",
    category: "Transaksi",
    description: "Daftar 3 produk teratas dengan akumulasi kuantitas penjualan tertinggi.",
    size: "medium"
  },
  {
    id: "recent_transactions_list",
    title: "Feed Transaksi Terbaru",
    category: "Transaksi",
    description: "Log real-time 3 transaksi terbaru beserta status pembayaran pelanggan.",
    size: "medium"
  },
  {
    id: "low_stock_quick_alert",
    title: "Pusat Alergi Stok Rendah",
    category: "Inventaris",
    description: "Panel restok cepat untuk produk yang kehabisan atau menipis stoknya.",
    size: "medium"
  }
];

interface AdminDashboardProps {
  currentRole: UserRole;
  userEmail: string;
  userName: string;
  onLogout: () => void;
}

export default function AdminDashboard({ currentRole, userEmail, userName, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "transactions" | "landing" | "rbac" | "reports" | "settings" | "suppliers">("overview");
  
  // Customizable Widgets State
  const [pinnedWidgetIds, setPinnedWidgetIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`topota_pinned_widgets_${userEmail}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load pinned widgets", e);
    }
    // Default widgets pinned
    return ["total_revenue", "total_orders", "low_stock_items", "inventory_value", "top_products_list"];
  });

  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

  // Save pinned widgets to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`topota_pinned_widgets_${userEmail}`, JSON.stringify(pinnedWidgetIds));
    } catch (e) {
      console.warn("Failed to save pinned widgets", e);
    }
  }, [pinnedWidgetIds, userEmail]);

  const handleToggleWidget = (widgetId: string) => {
    setPinnedWidgetIds(prev => {
      if (prev.includes(widgetId)) {
        if (prev.length <= 1) return prev; // Keep at least 1 widget
        return prev.filter(id => id !== widgetId);
      } else {
        return [...prev, widgetId];
      }
    });
  };

  const handleMoveWidget = (widgetId: string, direction: "up" | "down") => {
    setPinnedWidgetIds(prev => {
      const index = prev.indexOf(widgetId);
      if (index === -1) return prev;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[nextIndex];
      updated[nextIndex] = temp;
      return updated;
    });
  };

  const handleResetWidgets = () => {
    setPinnedWidgetIds(["total_revenue", "total_orders", "low_stock_items", "inventory_value", "top_products_list"]);
  };

  const handleWidgetQuickRestock = async (productId: string, amount: number = 10) => {
    const config = rolePermissions.find(r => r.roleId === currentRole);
    const allowed = userEmail === "sucipto.officiall@gmail.com" || 
                    currentRole === "admin" || 
                    (config ? config.editProducts : currentRole === "manager");
    if (!allowed) return;
    const currentProd = products.find(p => p.id === productId);
    if (currentProd) {
      await updateProduct(productId, {
        stock: currentProd.stock + amount
      });
      if (!isRealTimeEnabled) refreshData();
    }
  };

  const getTopProducts = () => {
    const prodCount: { [id: string]: { name: string; quantity: number; revenue: number } } = {};
    transactions.forEach(t => {
      if (t.paymentStatus === 'success') {
        t.items.forEach(item => {
          if (!prodCount[item.productId]) {
            prodCount[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
          }
          prodCount[item.productId].quantity += item.quantity;
          prodCount[item.productId].revenue += (item.priceAtSale * item.quantity);
        });
      }
    });
    return Object.values(prodCount)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);
  };

  const pinnedSmallWidgets = useMemo(() => {
    return ALL_WIDGETS.filter(w => w.size === "small" && pinnedWidgetIds.includes(w.id))
      .sort((a, b) => pinnedWidgetIds.indexOf(a.id) - pinnedWidgetIds.indexOf(b.id));
  }, [pinnedWidgetIds]);

  const pinnedMediumWidgets = useMemo(() => {
    return ALL_WIDGETS.filter(w => w.size === "medium" && pinnedWidgetIds.includes(w.id))
      .sort((a, b) => pinnedWidgetIds.indexOf(a.id) - pinnedWidgetIds.indexOf(b.id));
  }, [pinnedWidgetIds]);
  
  // Real-time states from Firestore
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [landingContent, setLandingContent] = useState<LandingContent | null>(null);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [backups, setBackups] = useState<InventoryBackup[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Filtering & UI states
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return (localStorage.getItem("admin_theme") as "light" | "dark") || "light";
    } catch {
      return "light";
    }
  });

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("admin_theme", nextTheme);
    } catch (err) {
      console.warn("Storage item save failed:", err);
    }
  };

  const [searchProduct, setSearchProduct] = useState("");
  const [isPredictionsOpen, setIsPredictionsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close predictions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsPredictionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [searchTransaction, setSearchTransaction] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [stockQuickInput, setStockQuickInput] = useState<{ [id: string]: number }>({});
  
  // Backup & Snapshot state
  const [backupNote, setBackupNote] = useState("");
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState("");

  // Product CRUD states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    lowStockThreshold: 5,
    imageUrl: "",
    category: "Makanan Utama",
    supplierId: "",
    status: "Aktif" as "Aktif" | "Nonaktif"
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBatchActionLoading, setIsBatchActionLoading] = useState(false);

  // CSV Import Bulk states
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [csvParsedData, setCsvParsedData] = useState<any[]>([]);
  const [isCsvApplying, setIsCsvApplying] = useState(false);
  const [csvSuccessCount, setCsvSuccessCount] = useState<number | null>(null);

  // Supplier Management states
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: ""
  });

  // Add User states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    displayName: "",
    email: "",
    role: "viewer" as UserRole
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState("");

  // Granular Role & Permission states
  const [rolePermissions, setRolePermissions] = useState<RolePermissionConfig[]>([]);
  const [rolePermissionsForm, setRolePermissionsForm] = useState<RolePermissionConfig[]>([]);
  const [savePermissionsLoading, setSavePermissionsLoading] = useState(false);
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    roleId: "",
    displayName: "",
    editProducts: false,
    editLanding: false,
    editSuppliers: false,
    manageBackups: false,
    manageRoles: false,
    viewTransactions: true
  });
  const [newRoleError, setNewRoleError] = useState("");

  // Synchronize dynamic state
  useEffect(() => {
    if (rolePermissions && rolePermissions.length > 0) {
      setRolePermissionsForm(rolePermissions);
    }
  }, [rolePermissions]);

  // Reset batch selections on tab change
  useEffect(() => {
    setSelectedProductIds([]);
  }, [activeTab]);

  const downloadCsvTemplate = () => {
    const csvContent = 
      "id,name,category,price,stock,lowStockThreshold,description,imageUrl\n" +
      ",Nasi Goreng Spesial Topota,Makanan Utama,25000,50,5,Nasi goreng dengan bumbu khas Topota dan telur mata sapi.,https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400\n" +
      ",Keripik Singkong Renyah,Camilan,12000,100,10,Keripik singkong gurih tanpa bahan pengawet.,https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400\n" +
      "example-id-123,Kopi Susu Gula Aren,Minuman,15000,40,8,Kopi espresso dicampur susu segar dan gula aren murni.,https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400";
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "templat_bulk_update_topota.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError("");
    setCsvSuccessCount(null);
    setCsvParsedData([]);

    if (!file.name.endsWith(".csv")) {
      setCsvError("Format berkas harus berupa CSV (.csv)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setCsvError("Gagal membaca isi berkas atau berkas kosong.");
          return;
        }

        const lines: string[] = [];
        let currentLine = "";
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === '\n' && !inQuotes) {
            lines.push(currentLine.trim());
            currentLine = '';
          } else if (char === '\r' && !inQuotes) {
            // skip
          } else {
            currentLine += char;
          }
        }
        if (currentLine) {
          lines.push(currentLine.trim());
        }

        if (lines.length === 0) {
          setCsvError("Berkas CSV kosong atau baris judul tidak ditemukan.");
          return;
        }

        // Parse headers
        const headers = parseCSVLine(lines[0]);
        const results: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          const values = parseCSVLine(line);
          const item: Record<string, string> = {};
          headers.forEach((header, index) => {
            const cleanHeader = header.trim().toLowerCase().replace(/['"“”]/g, "");
            const rawVal = values[index] ? values[index].trim() : '';
            // Remove surround quotes if any
            const cleanVal = rawVal.replace(/^["']|["']$/g, "");
            item[cleanHeader] = cleanVal;
          });
          results.push(item);
        }

        if (results.length === 0) {
          setCsvError("Tidak ada baris data produk dalam file CSV.");
          return;
        }

        // Map and validate
        const mapped = results.map((row) => {
          const id = row.id || "";
          const name = row.name || row.nama || "";
          const category = row.category || row.kategori || "Makanan Utama";
          const price = parseFloat(row.price || row.harga || "0") || 0;
          const stock = parseInt(row.stock || row.stok || "0", 10) || 0;
          const lowStockThreshold = parseInt(row.lowstockthreshold || row.low_stock_threshold || row.ambang_batas || "5", 10) || 5;
          const description = row.description || row.deskripsi || "";
          const imageUrl = row.imageurl || row.image_url || row.gambar || row.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";

          const exists = id ? products.some(p => p.id === id) : false;
          const action = exists ? "update" : "create";
          const isValid = name.trim().length > 0 && price >= 0 && stock >= 0;

          return {
            id,
            name,
            category,
            price,
            stock,
            lowStockThreshold,
            description,
            imageUrl,
            action,
            isValid
          };
        });

        setCsvParsedData(mapped);
      } catch (err: any) {
        console.error("Gagal mengurai CSV:", err);
        setCsvError("Kesalahan saat mengurai berkas: " + err.message);
      }
    };

    reader.onerror = () => {
      setCsvError("Gagal membaca berkas.");
    };

    reader.readAsText(file);
  };

  const applyBulkCsvUpdate = async () => {
    if (csvParsedData.length === 0) return;
    const invalidRows = csvParsedData.filter(r => !r.isValid);
    if (invalidRows.length > 0) {
      if (!window.confirm(`Ada ${invalidRows.length} baris data yang tidak valid yang akan dilewati. Lanjutkan proses impor data yang valid?`)) {
        return;
      }
    }

    setIsCsvApplying(true);
    setCsvError("");
    let appliedCount = 0;

    try {
      const validRows = csvParsedData.filter(r => r.isValid);
      for (const row of validRows) {
        if (row.action === "update") {
          await updateProduct(row.id, {
            name: row.name,
            category: row.category,
            price: row.price,
            stock: row.stock,
            lowStockThreshold: row.lowStockThreshold,
            description: row.description,
            imageUrl: row.imageUrl
          });
        } else {
          await addProduct({
            name: row.name,
            category: row.category,
            price: row.price,
            stock: row.stock,
            lowStockThreshold: row.lowStockThreshold,
            description: row.description,
            imageUrl: row.imageUrl
          });
        }
        appliedCount++;
      }

      setCsvSuccessCount(appliedCount);
      setCsvParsedData([]);
      const fileInput = document.getElementById("csv_file_uploader") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      if (!isRealTimeEnabled) refreshData();
    } catch (err: any) {
      console.error("Gagal menerapkan pembaruan massal:", err);
      setCsvError("Gagal menerapkan pembaruan massal: " + err.message);
    } finally {
      setIsCsvApplying(false);
    }
  };

  // Landing Page edit form state
  const [landingForm, setLandingForm] = useState<LandingContent | null>(null);
  const [isLandingSaved, setIsLandingSaved] = useState(false);

  // Customer Feedback / CRM state
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedback | null>(null);
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<"Semua" | "Baru" | "Dihubungi" | "Selesai">("Semua");
  const [feedbackNotesInput, setFeedbackNotesInput] = useState("");
  const [isUpdatingFeedback, setIsUpdatingFeedback] = useState(false);

  // Automated monthly reports state
  const [reportMonth, setReportMonth] = useState<"05" | "06" | "07">("06"); // default to June 2026

  // QR and Barcode states
  const [selectedScanProduct, setSelectedScanProduct] = useState<Product | null>(null);
  const [generatedQrCodeUrl, setGeneratedQrCodeUrl] = useState<string>("");
  const [physicalCountInput, setPhysicalCountInput] = useState<number | "">("");

  // Physical Stock Take (Stock Opname) Terminal states
  const [isOpnameTerminalOpen, setIsOpnameTerminalOpen] = useState<boolean>(false);
  const [terminalSearchInput, setTerminalSearchInput] = useState<string>("");
  const [terminalScannedProduct, setTerminalScannedProduct] = useState<Product | null>(null);
  const [terminalPhysicalCount, setTerminalPhysicalCount] = useState<number | "">("");
  const [terminalScanError, setTerminalScanError] = useState<string>("");
  const [terminalSuccessMsg, setTerminalSuccessMsg] = useState<string>("");
  const [opnameSessionLogs, setOpnameSessionLogs] = useState<Array<{
    productId: string;
    productName: string;
    prevStock: number;
    countedStock: number;
    discrepancy: number;
    timestamp: string;
  }>>([]);

  // Generate QR Code on product selection
  useEffect(() => {
    if (selectedScanProduct) {
      QRCode.toDataURL(selectedScanProduct.id, {
        width: 250,
        margin: 1.5,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      })
      .then((url) => {
        setGeneratedQrCodeUrl(url);
      })
      .catch((err) => {
        console.error("Gagal membuat QR Code:", err);
      });
      setPhysicalCountInput(selectedScanProduct.stock);
    } else {
      setGeneratedQrCodeUrl("");
      setPhysicalCountInput("");
    }
  }, [selectedScanProduct]);

  // Real-time vs Interval settings state
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("is_realtime_enabled");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("refresh_interval_seconds");
      return saved ? parseInt(saved, 10) : 30; // default 30s
    } catch {
      return 30;
    }
  });

  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshData = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [prodData, trxData] = await Promise.all([
        fetchProducts(),
        fetchTransactions()
      ]);
      setProducts(prodData);
      setTransactions(trxData);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error("Gagal memuat ulang data:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleToggleRealTime = (enabled: boolean) => {
    setIsRealTimeEnabled(enabled);
    try {
      localStorage.setItem("is_realtime_enabled", String(enabled));
    } catch (err) {
      console.warn("Gagal menyimpan pengaturan real-time:", err);
    }
  };

  const handleChangeInterval = (seconds: number) => {
    setRefreshInterval(seconds);
    try {
      localStorage.setItem("refresh_interval_seconds", String(seconds));
    } catch (err) {
      console.warn("Gagal menyimpan pengaturan interval:", err);
    }
  };
  
  // Connect subscriptions and interval-based polling
  useEffect(() => {
    const unsubLanding = subscribeToLandingContent((content) => {
      setLandingContent(content);
      setLandingForm(content);
    });
    const unsubUsers = subscribeToUserProfiles(setUserProfiles);
    const unsubBackups = subscribeToInventoryBackups(setBackups);
    const unsubSuppliers = subscribeToSuppliers(setSuppliers);
    const unsubRoles = subscribeToRolePermissions(setRolePermissions);
    const unsubFeedbacks = subscribeToFeedbacks(setFeedbacks);

    let unsubProducts: (() => void) | null = null;
    let unsubTransactions: (() => void) | null = null;
    let intervalId: any = null;

    if (isRealTimeEnabled) {
      // Real-time mode: Subscribe to Firestore changes
      unsubProducts = subscribeToProducts((prodData) => {
        setProducts(prodData);
        setLastRefreshedAt(new Date());
      });
      unsubTransactions = subscribeToTransactions((trxData) => {
        setTransactions(trxData);
        setLastRefreshedAt(new Date());
      });
    } else {
      // Polling/Manual mode: Fetch once initially
      refreshData();

      // Set up polling interval
      intervalId = setInterval(() => {
        refreshData();
      }, refreshInterval * 1000);
    }

    return () => {
      unsubLanding();
      unsubUsers();
      unsubBackups();
      unsubSuppliers();
      unsubRoles();
      unsubFeedbacks();
      if (unsubProducts) unsubProducts();
      if (unsubTransactions) unsubTransactions();
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRealTimeEnabled, refreshInterval, refreshData]);

  // Helpers
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // RBAC Permission Guards
  const currentRoleConfig = rolePermissions.find(r => r.roleId === currentRole);

  const canEditProducts = userEmail === "sucipto.officiall@gmail.com" || 
                          currentRole === "admin" || 
                          (currentRoleConfig ? currentRoleConfig.editProducts : currentRole === "manager");

  const canEditLanding = userEmail === "sucipto.officiall@gmail.com" || 
                         currentRole === "admin" || 
                         (currentRoleConfig ? currentRoleConfig.editLanding : currentRole === "admin");

  const canManageRoles = userEmail === "sucipto.officiall@gmail.com" || 
                         currentRole === "admin" || 
                         (currentRoleConfig ? currentRoleConfig.manageRoles : currentRole === "admin");

  const canEditSuppliers = userEmail === "sucipto.officiall@gmail.com" || 
                           currentRole === "admin" || 
                           (currentRoleConfig ? currentRoleConfig.editSuppliers : (currentRole === "admin" || currentRole === "manager"));

  // Compute stats
  const totalRevenue = transactions.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalOrders = transactions.length;
  const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold);
  const totalInventoryValue = products.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);

  // Recharts: Analytics Data Prep
  // Sales Trend May, June, July 2026
  const getSalesTrendData = () => {
    const monthlySales: { [key: string]: number } = { "Mei": 0, "Juni": 0, "Juli": 0 };
    transactions.forEach(t => {
      const dateObj = new Date(t.date);
      const month = dateObj.getMonth(); // 4 = May, 5 = June, 6 = July
      if (month === 4) monthlySales["Mei"] += t.totalAmount;
      if (month === 5) monthlySales["Juni"] += t.totalAmount;
      if (month === 6) monthlySales["Juli"] += t.totalAmount;
    });

    return [
      { name: "Mei 2026", "Pendapatan": monthlySales["Mei"] },
      { name: "Juni 2026", "Pendapatan": monthlySales["Juni"] },
      { name: "Juli 2026", "Pendapatan": monthlySales["Juli"] }
    ];
  };

  // Sales by Category
  const getCategorySalesData = () => {
    const categoryCounts: { [key: string]: number } = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const category = prod ? prod.category : "Dekorasi";
        categoryCounts[category] = (categoryCounts[category] || 0) + item.quantity;
      });
    });

    return Object.keys(categoryCounts).map(cat => ({
      name: cat,
      "Terjual": categoryCounts[cat]
    }));
  };

  const getBestSellersData = () => {
    return products
      .filter(p => p.soldCount > 0)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        "Jumlah": p.soldCount
      }));
  };

  const getInventoryFluctuationsData = () => {
    const currentTotalStock = products.reduce((acc, p) => acc + p.stock, 0);
    let currentTraceStock = currentTotalStock;
    
    // Group transaction quantities by relative day offset (0 = today, 1 = yesterday, etc.)
    const salesByDayOffset: { [key: number]: number } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      tDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - tDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 30) {
        const qty = t.items.reduce((sum, item) => sum + item.quantity, 0);
        salesByDayOffset[diffDays] = (salesByDayOffset[diffDays] || 0) + qty;
      }
    });

    // Simulating restock events on days offset 3, 9, 16, 23 to show realistic replenishment spikes
    const restockOffsets = [3, 9, 16, 23];
    const stockHistory: { dateStr: string; stock: number }[] = [];
    
    for (let offset = 0; offset < 30; offset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - offset);
      const dateStr = targetDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      
      stockHistory.push({
        dateStr,
        stock: currentTraceStock
      });
      
      // Go backward: add back the sales that happened on this day
      const sales = salesByDayOffset[offset] || 0;
      currentTraceStock += sales;
      
      // Go backward: if there was a simulated restock on this day, subtract it (as we are moving back in time)
      if (restockOffsets.includes(offset)) {
        currentTraceStock = Math.max(currentTotalStock > 100 ? 80 : 15, currentTraceStock - 45);
      }
    }
    
    // Reverse the history to show chronological order (Day -29 to Day 0)
    return stockHistory.reverse().map(item => ({
      name: item.dateStr,
      "Tingkat Stok": item.stock
    }));
  };

  // Quick stock updater
  const handleQuickRestock = async (productId: string) => {
    if (!canEditProducts) return;
    const addedAmount = stockQuickInput[productId];
    if (!addedAmount || addedAmount <= 0) return;

    const currentProd = products.find(p => p.id === productId);
    if (currentProd) {
      await updateProduct(productId, {
        stock: currentProd.stock + addedAmount
      });
      setStockQuickInput(prev => ({ ...prev, [productId]: 0 }));
      if (!isRealTimeEnabled) refreshData();
    }
  };

  // Handle product add/edit submission
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditProducts) return;

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          lowStockThreshold: Number(productForm.lowStockThreshold),
          imageUrl: productForm.imageUrl || "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
          category: productForm.category,
          supplierId: productForm.supplierId || "",
          status: productForm.status
        });
      } else {
        await addProduct({
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          lowStockThreshold: Number(productForm.lowStockThreshold),
          imageUrl: productForm.imageUrl || "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
          category: productForm.category,
          supplierId: productForm.supplierId || "",
          status: productForm.status
        });
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        lowStockThreshold: 5,
        imageUrl: "",
        category: "Makanan Utama",
        supplierId: "",
        status: "Aktif"
      });
      if (!isRealTimeEnabled) refreshData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan produk.");
    }
  };

  const openEditProduct = (prod: Product) => {
    if (!canEditProducts) return;
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description,
      price: prod.price,
      stock: prod.stock,
      lowStockThreshold: prod.lowStockThreshold,
      imageUrl: prod.imageUrl,
      category: prod.category,
      supplierId: prod.supplierId || "",
      status: prod.status || "Aktif"
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!canEditProducts) return;
    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.")) {
      await deleteProduct(id);
      setSelectedProductIds(prev => prev.filter(item => item !== id));
      if (!isRealTimeEnabled) refreshData();
    }
  };

  const handleBulkDelete = async () => {
    if (!canEditProducts) {
      alert("Peran Anda tidak diizinkan untuk menghapus produk.");
      return;
    }
    if (selectedProductIds.length === 0) return;

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${selectedProductIds.length} produk terpilih secara massal? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setIsBatchActionLoading(true);
    try {
      await Promise.all(selectedProductIds.map(id => deleteProduct(id)));
      setSelectedProductIds([]);
      if (!isRealTimeEnabled) refreshData();
      alert("Berhasil menghapus produk terpilih secara massal.");
    } catch (error) {
      console.error("Gagal melakukan hapus masal:", error);
      alert("Gagal menghapus beberapa produk.");
    } finally {
      setIsBatchActionLoading(false);
    }
  };

  const handleBulkUpdateStatus = async (newStatus: "Aktif" | "Nonaktif") => {
    if (!canEditProducts) {
      alert("Peran Anda tidak diizinkan untuk mengubah status produk.");
      return;
    }
    if (selectedProductIds.length === 0) return;

    setIsBatchActionLoading(true);
    try {
      await Promise.all(
        selectedProductIds.map(id => updateProduct(id, { status: newStatus }))
      );
      setSelectedProductIds([]);
      if (!isRealTimeEnabled) refreshData();
      alert(`Berhasil memperbarui status ${selectedProductIds.length} produk terpilih menjadi ${newStatus}.`);
    } catch (error) {
      console.error("Gagal memperbarui status masal:", error);
      alert("Gagal memperbarui status produk.");
    } finally {
      setIsBatchActionLoading(false);
    }
  };

  // Supplier CRUD Handlers
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSuppliers) return;

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, {
          name: supplierForm.name,
          contactName: supplierForm.contactName,
          email: supplierForm.email,
          phone: supplierForm.phone,
          address: supplierForm.address
        });
      } else {
        await addSupplier({
          name: supplierForm.name,
          contactName: supplierForm.contactName,
          email: supplierForm.email,
          phone: supplierForm.phone,
          address: supplierForm.address
        });
      }
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      setSupplierForm({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        address: ""
      });
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan supplier.");
    }
  };

  const openEditSupplier = (sup: Supplier) => {
    if (!canEditSuppliers) return;
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name,
      contactName: sup.contactName || "",
      email: sup.email || "",
      phone: sup.phone || "",
      address: sup.address || ""
    });
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!canEditSuppliers) return;
    if (window.confirm("Apakah Anda yakin ingin menghapus supplier ini? Hubungan produk ke supplier ini akan diputus.")) {
      try {
        await deleteSupplier(id);
        // Clean supplier links from products
        const linkedProds = products.filter(p => p.supplierId === id);
        for (const p of linkedProds) {
          await updateProduct(p.id, { supplierId: "" });
        }
        if (selectedSupplierId === id) {
          setSelectedSupplierId(null);
        }
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus supplier.");
      }
    }
  };

  // Play simulated scanner beep using Web Audio API
  const playBeep = (type: "success" | "error" | "scan" = "scan") => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === "success") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.08);
        
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1300, audioCtx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.1);
        osc2.start(audioCtx.currentTime + 0.1);
        osc2.stop(audioCtx.currentTime + 0.22);
      } else if (type === "error") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(180, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        oscillator.stop(audioCtx.currentTime + 0.4);
      } else {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.07);
      }
    } catch (err) {
      console.warn("AudioContext block/fail:", err);
    }
  };

  // Adjust stock for a single product from the ID card modal
  const handleSingleProductStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScanProduct || !canEditProducts) return;
    
    const count = Number(physicalCountInput);
    if (isNaN(count) || count < 0) {
      alert("Masukkan jumlah fisik stok yang valid.");
      return;
    }
    
    try {
      const prev = selectedScanProduct.stock;
      const discrepancy = count - prev;
      await updateProduct(selectedScanProduct.id, { stock: count });
      
      // Log this opname entry in session state
      const logEntry = {
        productId: selectedScanProduct.id,
        productName: selectedScanProduct.name,
        prevStock: prev,
        countedStock: count,
        discrepancy: discrepancy,
        timestamp: new Date().toLocaleTimeString("id-ID")
      };
      setOpnameSessionLogs(prevLogs => [logEntry, ...prevLogs]);
      
      playBeep("success");
      alert(`Stok produk "${selectedScanProduct.name}" berhasil diubah menjadi ${count} unit (Selisih: ${discrepancy > 0 ? "+" : ""}${discrepancy}).`);
      
      // Update selected product state to show local update
      setSelectedScanProduct(prevProd => prevProd ? { ...prevProd, stock: count } : null);
      if (!isRealTimeEnabled) refreshData();
    } catch (err) {
      console.error(err);
      playBeep("error");
      alert("Gagal memperbarui stok.");
    }
  };

  // Perform barcode scanning in Stock Opname Terminal
  const handleTerminalBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    setTerminalScanError("");
    setTerminalSuccessMsg("");
    
    const term = terminalSearchInput.trim();
    if (!term) return;
    
    // Find matching product by SKU/ID or exact name match
    const found = products.find(
      p => p.id.toUpperCase() === term.toUpperCase() ||
           p.name.toUpperCase() === term.toUpperCase() ||
           p.id.toUpperCase().slice(0, 8) === term.toUpperCase()
    );
    
    if (found) {
      playBeep("scan");
      setTerminalScannedProduct(found);
      setTerminalPhysicalCount(found.stock); // pre-populate with current stock
      
      // Focus quantity field
      setTimeout(() => {
        const qtyField = document.getElementById("terminal_qty_input");
        if (qtyField) qtyField.focus();
      }, 50);
    } else {
      playBeep("error");
      setTerminalScannedProduct(null);
      setTerminalScanError(`SKU/ID atau Nama Produk "${term}" tidak ditemukan.`);
    }
  };

  // Save the counted stock from Terminal
  const handleTerminalStockSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalScannedProduct || !canEditProducts) return;
    
    const count = Number(terminalPhysicalCount);
    if (isNaN(count) || count < 0) {
      playBeep("error");
      setTerminalScanError("Masukkan angka stok fisik yang valid.");
      return;
    }
    
    try {
      const prev = terminalScannedProduct.stock;
      const discrepancy = count - prev;
      await updateProduct(terminalScannedProduct.id, { stock: count });
      
      const logEntry = {
        productId: terminalScannedProduct.id,
        productName: terminalScannedProduct.name,
        prevStock: prev,
        countedStock: count,
        discrepancy: discrepancy,
        timestamp: new Date().toLocaleTimeString("id-ID")
      };
      setOpnameSessionLogs(prevLogs => [logEntry, ...prevLogs]);
      
      playBeep("success");
      setTerminalSuccessMsg(`Stok "${terminalScannedProduct.name}" berhasil diperbarui menjadi ${count} unit (Selisih: ${discrepancy > 0 ? "+" : ""}${discrepancy})`);
      
      // Reset scanner for next item
      setTerminalSearchInput("");
      setTerminalScannedProduct(null);
      setTerminalPhysicalCount("");
      if (!isRealTimeEnabled) refreshData();
      
      // Auto refocus scanning input if possible
      const scanInput = document.getElementById("terminal_scan_input");
      if (scanInput) {
        setTimeout(() => scanInput.focus(), 80);
      }
    } catch (err) {
      console.error(err);
      playBeep("error");
      setTerminalScanError("Gagal menyimpan pembaruan ke database.");
    }
  };

  // PDF Label Printing for a Product
  const downloadProductLabelPDF = (p: Product) => {
    try {
      // Small labeling format: 80mm width x 80mm height
      const docLabel = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 80]
      });

      // Styling: simple border
      docLabel.setDrawColor(220, 220, 220);
      docLabel.rect(2, 2, 76, 76);

      // Brand Header
      docLabel.setFont("Helvetica", "bold");
      docLabel.setFontSize(8);
      docLabel.setTextColor(115, 115, 115);
      docLabel.text("KARTU IDENTIFIKASI BARANG - TOPOTA.ID", 40, 7, { align: "center" });
      docLabel.setLineWidth(0.2);
      docLabel.line(4, 9, 76, 9);

      // Product Title
      docLabel.setFont("Helvetica", "bold");
      docLabel.setFontSize(11);
      docLabel.setTextColor(23, 23, 23);
      
      // Truncate name for small labels
      const displayName = p.name.length > 25 ? p.name.slice(0, 24) + "..." : p.name;
      docLabel.text(displayName, 40, 14, { align: "center" });

      // Subtitle details
      docLabel.setFont("Helvetica", "normal");
      docLabel.setFontSize(7.5);
      docLabel.setTextColor(84, 84, 84);
      docLabel.text(`Kategori: ${p.category}   |   Harga: Rp ${p.price.toLocaleString("id-ID")}`, 40, 18, { align: "center" });

      // DRAW crisp vector Barcode manually in PDF
      const barcodeStartY = 21;
      const barcodeHeight = 11;
      
      // Code 39 Encodings for PDF vector rendering
      const CODE39_PATTERNS: { [key: string]: string } = {
        '0': 'nnnwwwnwn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
        '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
        '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw',
        'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn',
        'G': 'nnnnnwnww', 'H': 'wnnnnwnwn', 'I': 'nnwnnwnwn', 'J': 'nnnnwwnwn',
        'K': 'wnnnnnnww', 'L': 'nnwnnnnnw', 'M': 'wnwnnnnnn', 'N': 'nnnnwnnww',
        'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn',
        'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn', 'U': 'wwnnnnnnw', 'V': 'nwnnnnnnw',
        'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
        '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn'
      };

      const upperSKU = p.id.toUpperCase();
      const cleanSKU = ('*' + upperSKU + '*').split('').map(c => CODE39_PATTERNS[c] ? c : ' ');

      // Calculate total barcode width to center it
      let barcodeModulesCount = 0;
      const narrowPDF = 0.35;
      const widePDF = 0.85;
      
      cleanSKU.forEach(c => {
        const pattern = CODE39_PATTERNS[c];
        for (let i = 0; i < 9; i++) {
          barcodeModulesCount += (pattern[i] === 'w' ? widePDF : narrowPDF);
        }
        barcodeModulesCount += narrowPDF; // inter char space
      });
      // remove trailing inter char space
      barcodeModulesCount -= narrowPDF;

      // Start centering calculation
      let startX = 40 - (barcodeModulesCount / 2);
      
      cleanSKU.forEach((c, cIdx) => {
        const pattern = CODE39_PATTERNS[c];
        for (let i = 0; i < 9; i++) {
          const isBar = i % 2 === 0;
          const size = pattern[i] === 'w' ? widePDF : narrowPDF;
          
          if (isBar) {
            docLabel.setFillColor(0, 0, 0);
            docLabel.rect(startX, barcodeStartY, size, barcodeHeight, "F");
          }
          startX += size;
        }
        if (cIdx < cleanSKU.length - 1) {
          startX += narrowPDF;
        }
      });

      // Human readable SKU Text
      docLabel.setFont("Courier", "bold");
      docLabel.setFontSize(8);
      docLabel.setTextColor(0, 0, 0);
      docLabel.text(`*${p.id}*`, 40, 35, { align: "center" });

      // Embed Generated QR Code at the bottom half
      QRCode.toDataURL(p.id, { width: 150, margin: 1 })
        .then((qrUrl) => {
          docLabel.addImage(qrUrl, "PNG", 26, 38, 28, 28);
          
          docLabel.setFont("Helvetica", "normal");
          docLabel.setFontSize(6.5);
          docLabel.setTextColor(150, 150, 150);
          docLabel.text("Scan barcode atau QR code di atas untuk Stock Opname", 40, 70, { align: "center" });
          docLabel.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 40, 73, { align: "center" });

          // Trigger download
          docLabel.save(`LABEL_${p.id}.pdf`);
        })
        .catch((err) => {
          console.error("Gagal menambahkan QR code ke PDF:", err);
          docLabel.save(`LABEL_${p.id}.pdf`);
        });

    } catch (err) {
      console.error("Gagal membuat berkas PDF label:", err);
      alert("Gagal mengunduh label PDF.");
    }
  };

  // Save Landing Page Content
  const handleSaveLanding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditLanding || !landingForm) return;

    try {
      await updateLandingContent(landingForm);
      setIsLandingSaved(true);
      setTimeout(() => setIsLandingSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui landing page.");
    }
  };

  // Change user role
  const handleChangeRole = async (uid: string, targetRole: UserRole) => {
    if (!canManageRoles) return;
    try {
      await updateUserRole(uid, targetRole);
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui peran pengguna.");
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRoles) return;
    setAddUserLoading(true);
    setAddUserError("");

    try {
      if (!addUserForm.displayName.trim() || !addUserForm.email.trim()) {
        throw new Error("Nama dan email wajib diisi.");
      }
      
      const isDuplicate = userProfiles.some(
        u => u.email.toLowerCase() === addUserForm.email.trim().toLowerCase()
      );
      if (isDuplicate) {
        throw new Error("Email ini sudah terdaftar sebagai pengguna.");
      }

      await createUserProfile(
        addUserForm.email.trim(),
        addUserForm.displayName.trim(),
        addUserForm.role
      );

      setAddUserForm({
        displayName: "",
        email: "",
        role: "viewer"
      });
      setIsAddUserModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setAddUserError(err.message || "Gagal menambahkan pengguna.");
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleDeleteUser = async (uid: string, userDisplayName: string) => {
    if (!canManageRoles) return;
    if (uid.startsWith("demo-") || uid === "sucipto-super-admin" || uid.includes("demo-")) {
      alert("Akun demo bawaan dan Super Admin utama tidak boleh dihapus demi keamanan demo.");
      return;
    }
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userDisplayName}" dari sistem?`)) {
      return;
    }

    try {
      await deleteUserProfile(uid);
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus pengguna: " + err.message);
    }
  };

  // Granular Role & Permission Handlers
  const handleTogglePermission = (roleId: string, field: keyof Omit<RolePermissionConfig, "roleId" | "displayName">) => {
    if (!canManageRoles) return;
    setRolePermissionsForm(prev => prev.map(role => {
      if (role.roleId === roleId) {
        return {
          ...role,
          [field]: !role[field]
        };
      }
      return role;
    }));
  };

  const handleUpdateRoleDisplayName = (roleId: string, newName: string) => {
    if (!canManageRoles) return;
    setRolePermissionsForm(prev => prev.map(role => {
      if (role.roleId === roleId) {
        return {
          ...role,
          displayName: newName
        };
      }
      return role;
    }));
  };

  const handleAddCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRoles) return;
    setNewRoleError("");

    const id = newRoleForm.roleId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const name = newRoleForm.displayName.trim();

    if (!id || !name) {
      setNewRoleError("ID Peran dan Nama Peran wajib diisi.");
      return;
    }

    if (rolePermissionsForm.some(r => r.roleId === id)) {
      setNewRoleError(`ID Peran "${id}" sudah digunakan.`);
      return;
    }

    const newRole: RolePermissionConfig = {
      roleId: id,
      displayName: name,
      editProducts: newRoleForm.editProducts,
      editLanding: newRoleForm.editLanding,
      editSuppliers: newRoleForm.editSuppliers,
      manageBackups: newRoleForm.manageBackups,
      manageRoles: newRoleForm.manageRoles,
      viewTransactions: newRoleForm.viewTransactions
    };

    const updated = [...rolePermissionsForm, newRole];
    setRolePermissionsForm(updated);
    
    setNewRoleForm({
      roleId: "",
      displayName: "",
      editProducts: false,
      editLanding: false,
      editSuppliers: false,
      manageBackups: false,
      manageRoles: false,
      viewTransactions: true
    });
    setIsNewRoleModalOpen(false);
  };

  const handleDeleteRole = (roleId: string) => {
    if (!canManageRoles) return;
    if (["admin", "manager", "viewer"].includes(roleId)) {
      alert("Peran sistem utama (admin, manager, viewer) tidak dapat dihapus.");
      return;
    }

    const usersWithThisRole = userProfiles.filter(u => u.role === roleId);
    if (usersWithThisRole.length > 0) {
      alert(`Tidak dapat menghapus peran ini karena masih digunakan oleh ${usersWithThisRole.length} pengguna.`);
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin menghapus peran kustom ini?")) {
      return;
    }

    const updated = rolePermissionsForm.filter(r => r.roleId !== roleId);
    setRolePermissionsForm(updated);
  };

  const handleSaveRolePermissions = async () => {
    if (!canManageRoles) return;
    setSavePermissionsLoading(true);
    try {
      await updateRolePermissions(rolePermissionsForm);
      alert("Konfigurasi tingkat akses & izin peran granular berhasil disimpan.");
    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan konfigurasi: " + err.message);
    } finally {
      setSavePermissionsLoading(false);
    }
  };

  const handleResetRolePermissions = async () => {
    if (!canManageRoles) return;
    if (!window.confirm("Apakah Anda yakin ingin mereset semua izin ke pengaturan default pabrik?")) {
      return;
    }
    setSavePermissionsLoading(true);
    try {
      await updateRolePermissions(defaultRolePermissions);
      setRolePermissionsForm(defaultRolePermissions);
      alert("Konfigurasi tingkat akses telah direset ke default.");
    } catch (err: any) {
      console.error(err);
      alert("Gagal mereset: " + err.message);
    } finally {
      setSavePermissionsLoading(false);
    }
  };

  // Excel/CSV Exports
  const exportProductsExcel = () => {
    const dataToExport = products.map((p, idx) => ({
      "No": idx + 1,
      "ID Produk": p.id,
      "Nama Produk": p.name,
      "Kategori": p.category,
      "Harga (IDR)": p.price,
      "Stok": p.stock,
      "Ambang Stok Rendah": p.lowStockThreshold,
      "Total Terjual": p.soldCount,
      "Estimasi Nilai Inventaris": p.price * p.stock
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar_Inventaris");
    XLSX.writeFile(workbook, "Daftar_Inventaris_Selasar.xlsx");
  };

  const exportTransactionsExcel = () => {
    const dataToExport = transactions.map((t, idx) => ({
      "No": idx + 1,
      "ID Transaksi": t.id,
      "Nama Pelanggan": t.customerName,
      "Email Pelanggan": t.customerEmail,
      "Tanggal": new Date(t.date).toLocaleDateString("id-ID"),
      "Metode Pembayaran": t.paymentMethod,
      "Jumlah Items": t.items.reduce((sum, i) => sum + i.quantity, 0),
      "Total Nominal (IDR)": t.totalAmount,
      "Status": t.paymentStatus.toUpperCase()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan_Penjualan");
    XLSX.writeFile(workbook, "Laporan_Penjualan_Topota.xlsx");
  };

  // PDF Export
  const generateSalesLedgerPDF = () => {
    const doc = new jsPDF();
    
    // Document Styles & Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text("TOPOTA.ID FOODS", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text("Jl. Raya Kuliner No. 12, Jakarta", 14, 26);
    doc.text("Email: admin@topota.id | Phone: +62 812-3456-7890", 14, 31);
    
    doc.line(14, 35, 196, 35); // line separator
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN TRANSAKSI PENJUALAN", 14, 45);
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 51);
    doc.text(`Petugas Cetak: ${userName} (${currentRole.toUpperCase()})`, 14, 56);
    
    // Table Setup
    let y = 65;
    doc.setFillColor(40, 40, 40);
    doc.rect(14, y, 182, 8, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.text("No", 16, y + 5.5);
    doc.text("Pelanggan", 26, y + 5.5);
    doc.text("Tanggal", 75, y + 5.5);
    doc.text("Metode Pembayaran", 110, y + 5.5);
    doc.text("Total (IDR)", 160, y + 5.5);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("Helvetica", "normal");
    
    transactions.forEach((t, index) => {
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      // Zebra striping
      if (index % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y, 182, 8, "F");
      }
      
      doc.text((index + 1).toString(), 16, y + 5.5);
      doc.text(t.customerName.substring(0, 20), 26, y + 5.5);
      doc.text(new Date(t.date).toLocaleDateString("id-ID"), 75, y + 5.5);
      doc.text(t.paymentMethod.substring(0, 18), 110, y + 5.5);
      doc.text(t.totalAmount.toLocaleString("id-ID"), 160, y + 5.5);
    });
    
    // Summary
    y += 12;
    doc.line(14, y, 196, y);
    doc.setFont("Helvetica", "bold");
    doc.text("Total Pendapatan Akumulatif:", 100, y + 6);
    doc.text(`Rp ${totalRevenue.toLocaleString("id-ID")}`, 160, y + 6);
    
    doc.save("Laporan_Keuangan_Topota.pdf");
  };

  // Automated Monthly Report Builder
  const getMonthlyReportData = () => {
    const monthNames = { "05": "Mei 2026", "06": "Juni 2026", "07": "Juli 2026" };
    const monthStr = reportMonth;
    const filteredTrx = transactions.filter(t => {
      const date = new Date(t.date);
      const m = String(date.getMonth() + 1).padStart(2, "0");
      return m === monthStr;
    });

    const monthlyRevenue = filteredTrx.reduce((sum, t) => sum + t.totalAmount, 0);
    const monthlySalesVolume = filteredTrx.reduce((sum, t) => sum + t.items.reduce((iSum, item) => iSum + item.quantity, 0), 0);
    
    // Best Selling in Selected Month
    const prodCount: { [id: string]: { name: string, quantity: number, total: number } } = {};
    filteredTrx.forEach(t => {
      t.items.forEach(item => {
        if (!prodCount[item.productId]) {
          prodCount[item.productId] = { name: item.name, quantity: 0, total: 0 };
        }
        prodCount[item.productId].quantity += item.quantity;
        prodCount[item.productId].total += item.priceAtSale * item.quantity;
      });
    });

    const bestSellers = Object.keys(prodCount)
      .map(id => ({ id, ...prodCount[id] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    return {
      periodName: monthNames[reportMonth],
      totalRevenue: monthlyRevenue,
      salesVolume: monthlySalesVolume,
      transactionCount: filteredTrx.length,
      averageTicketSize: filteredTrx.length > 0 ? Math.round(monthlyRevenue / filteredTrx.length) : 0,
      bestSellers,
      rawTransactions: filteredTrx
    };
  };

  const monthlyReport = getMonthlyReportData();

  // Export Monthly Report PDF
  const downloadMonthlyReportPDF = () => {
    const doc = new jsPDF();
    const rep = monthlyReport;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(24, 24, 24);
    doc.text("TOPOTA.ID FOODS", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Sistem Pelaporan Keuangan dan Inventaris Terintegrasi", 14, 26);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString("id-ID")}`, 14, 31);
    doc.line(14, 35, 196, 35);

    // Title Section
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.text(`LAPORAN KINERJA BULANAN - ${rep.periodName.toUpperCase()}`, 14, 45);

    // Executive Summary Boxes
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 52, 85, 28, "F");
    doc.rect(111, 52, 85, 28, "F");

    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text("TOTAL PENDAPATAN", 18, 59);
    doc.text("VOLUME PENJUALAN", 115, 59);

    doc.setFontSize(15);
    doc.setTextColor(15, 80, 50); // green
    doc.text(formatRupiah(rep.totalRevenue), 18, 69);
    doc.setTextColor(24, 24, 24);
    doc.text(`${rep.salesVolume} unit barang`, 115, 69);

    // General Metrics
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text("RINGKASAN UTAMA", 14, 93);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    let myY = 101;
    
    const summaryItems = [
      { label: "Jumlah Transaksi Sukses", value: `${rep.transactionCount} kali` },
      { label: "Rata-rata Nilai Belanja (AOV)", value: formatRupiah(rep.averageTicketSize) },
      { label: "Nilai Aset Inventaris Aktif", value: formatRupiah(totalInventoryValue) },
      { label: "Item Stok Rendah Saat Ini", value: `${lowStockItems.length} produk` }
    ];

    summaryItems.forEach(item => {
      doc.text(item.label, 14, myY);
      doc.setFont("Helvetica", "bold");
      doc.text(item.value, 110, myY);
      doc.setFont("Helvetica", "normal");
      doc.line(14, myY + 2, 196, myY + 2);
      myY += 10;
    });

    // Best Sellers List
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PRODUK TERLARIS BULAN INI", 14, myY + 5);

    myY += 13;
    doc.setFillColor(40, 40, 40);
    doc.rect(14, myY, 182, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("Nama Produk", 16, myY + 5.5);
    doc.text("Unit Terjual", 120, myY + 5.5);
    doc.text("Subtotal Omset", 155, myY + 5.5);

    doc.setTextColor(0, 0, 0);
    doc.setFont("Helvetica", "normal");
    
    if (rep.bestSellers.length === 0) {
      myY += 8;
      doc.text("Tidak ada data transaksi pada bulan ini.", 16, myY + 5.5);
    } else {
      rep.bestSellers.forEach((item, index) => {
        myY += 8;
        if (index % 2 === 1) {
          doc.setFillColor(245, 245, 245);
          doc.rect(14, myY, 182, 8, "F");
        }
        doc.text(item.name, 16, myY + 5.5);
        doc.text(`${item.quantity} unit`, 120, myY + 5.5);
        doc.text(formatRupiah(item.total), 155, myY + 5.5);
      });
    }

    // Signatures
    myY += 25;
    if (myY > 260) {
      doc.addPage();
      myY = 20;
    }
    doc.setFontSize(9);
    doc.text("Disetujui oleh,", 14, myY);
    doc.text("Dibuat oleh,", 140, myY);
    
    doc.setFont("Helvetica", "bold");
    doc.text("Direktur topota.id", 14, myY + 22);
    doc.text(`${userName}`, 140, myY + 22);
    doc.setFont("Helvetica", "normal");
    doc.text(`Role: ${currentRole.toUpperCase()}`, 140, myY + 26);

    doc.save(`Laporan_Bulanan_Topota_${rep.periodName.replace(" ", "_")}.pdf`);
  };

  const handleCreateSnapshot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (products.length === 0) return;
    
    setIsBackupLoading(true);
    setBackupSuccessMessage("");
    try {
      const note = backupNote.trim() || "Manual Quick Snapshot";
      await createInventoryBackup(userEmail || userName || "Admin", products, note);
      setBackupNote("");
      setBackupSuccessMessage("Snapshot inventaris berhasil disimpan sebagai salinan cadangan aman!");
      setTimeout(() => setBackupSuccessMessage(""), 5000);
    } catch (error: any) {
      console.error("Gagal membuat snapshot:", error);
      alert("Gagal membuat snapshot: " + error.message);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleRestoreSnapshot = async (backup: InventoryBackup) => {
    if (!window.confirm(`Apakah Anda yakin ingin memulihkan inventaris dari snapshot tanggal ${new Date(backup.createdAt).toLocaleString("id-ID")}?\nTindakan ini akan menimpa stok dan detail produk yang ada saat ini.`)) {
      return;
    }

    setIsBackupLoading(true);
    try {
      // Restore products by overwriting stocks/prices
      for (const backedProduct of backup.products) {
        await updateProduct(backedProduct.id, {
          stock: backedProduct.stock,
          price: backedProduct.price,
          name: backedProduct.name,
          category: backedProduct.category,
          description: backedProduct.description,
          imageUrl: backedProduct.imageUrl
        });
      }
      alert("Inventaris berhasil dipulihkan dari snapshot!");
      if (!isRealTimeEnabled) refreshData();
    } catch (error: any) {
      console.error("Gagal memulihkan snapshot:", error);
      alert("Gagal memulihkan snapshot: " + error.message);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus snapshot cadangan ini?")) {
      return;
    }
    try {
      await deleteInventoryBackup(id);
    } catch (error: any) {
      console.error("Gagal menghapus snapshot:", error);
      alert("Gagal menghapus snapshot: " + error.message);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-50 text-red-700 border-red-100";
      case "manager":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "viewer":
        return "bg-blue-50 text-blue-700 border-blue-100";
      default:
        return "bg-neutral-50 text-neutral-600 border-neutral-100";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const found = rolePermissions.find(r => r.roleId === role);
    if (found) return found.displayName;
    switch (role) {
      case "admin": return "Super Admin";
      case "manager": return "Store Keeper / Manager";
      case "viewer": return "Viewer / Staff";
      default: return role;
    }
  };

  // Fuzzy match scoring function for predictive search
  const getFuzzyScore = (item: Product, query: string): number => {
    if (!query) return 1;
    const q = query.toLowerCase().trim();
    const name = item.name.toLowerCase();
    const category = item.category.toLowerCase();
    const sku = (item.id || "").toLowerCase();

    // Exact matches get highest score
    if (name === q) return 100;
    if (sku === q) return 95;
    if (category === q) return 90;

    // Prefix matches
    if (name.startsWith(q)) return 80;
    if (sku.startsWith(q)) return 75;

    // Substring matches
    if (name.includes(q)) return 60;
    if (sku.includes(q)) return 55;
    if (category.includes(q)) return 50;

    // Subsequence matching (fuzzy match)
    let score = 0;
    let nameIdx = 0;
    let matchCount = 0;
    for (let i = 0; i < q.length; i++) {
      const char = q[i];
      const foundIdx = name.indexOf(char, nameIdx);
      if (foundIdx !== -1) {
        matchCount++;
        // Reward adjacent characters
        if (foundIdx === nameIdx) {
          score += 10;
        } else {
          score += 5;
        }
        nameIdx = foundIdx + 1;
      }
    }

    if (matchCount === q.length) {
      return score; // Valid fuzzy match subsequence
    }

    // Also check SKU subsequence
    let skuIdx = 0;
    let skuMatchCount = 0;
    let skuScore = 0;
    for (let i = 0; i < q.length; i++) {
      const char = q[i];
      const foundIdx = sku.indexOf(char, skuIdx);
      if (foundIdx !== -1) {
        skuMatchCount++;
        if (foundIdx === skuIdx) {
          skuScore += 10;
        } else {
          skuScore += 5;
        }
        skuIdx = foundIdx + 1;
      }
    }

    if (skuMatchCount === q.length) {
      return skuScore;
    }

    // Also check Category subsequence
    let catIdx = 0;
    let catMatchCount = 0;
    let catScore = 0;
    for (let i = 0; i < q.length; i++) {
      const char = q[i];
      const foundIdx = category.indexOf(char, catIdx);
      if (foundIdx !== -1) {
        catMatchCount++;
        if (foundIdx === catIdx) {
          catScore += 10;
        } else {
          catScore += 5;
        }
        catIdx = foundIdx + 1;
      }
    }

    if (catMatchCount === q.length) {
      return catScore;
    }

    return 0; // No match
  };

  const filteredInventory = useMemo(() => {
    if (!searchProduct.trim()) {
      return products.filter(p => selectedCategory === "Semua" || p.category === selectedCategory);
    }
    
    return products
      .map(p => ({ product: p, score: getFuzzyScore(p, searchProduct) }))
      .filter(item => {
        const matchesCategory = selectedCategory === "Semua" || item.product.category === selectedCategory;
        return item.score > 0 && matchesCategory;
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);
  }, [products, searchProduct, selectedCategory]);

  const predictiveSuggestions = useMemo(() => {
    if (!searchProduct.trim()) return [];
    
    return products
      .map(p => ({ product: p, score: getFuzzyScore(p, searchProduct) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // top 5 predictions
  }, [products, searchProduct]);

  const isAllFilteredSelected = useMemo(() => {
    return filteredInventory.length > 0 && filteredInventory.every(p => selectedProductIds.includes(p.id));
  }, [filteredInventory, selectedProductIds]);

  const isSomeFilteredSelected = useMemo(() => {
    return filteredInventory.length > 0 && 
           filteredInventory.some(p => selectedProductIds.includes(p.id)) && 
           !isAllFilteredSelected;
  }, [filteredInventory, selectedProductIds, isAllFilteredSelected]);

  const handleSelectAllToggle = () => {
    if (isAllFilteredSelected) {
      const filteredIds = filteredInventory.map(p => p.id);
      setSelectedProductIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredInventory.map(p => p.id);
      setSelectedProductIds(prev => {
        const newSelections = [...prev];
        filteredIds.forEach(id => {
          if (!newSelections.includes(id)) {
            newSelections.push(id);
          }
        });
        return newSelections;
      });
    }
  };

  const handleSelectRowToggle = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const filteredTrxHistory = transactions.filter(t => {
    return t.customerName.toLowerCase().includes(searchTransaction.toLowerCase()) ||
           t.customerEmail.toLowerCase().includes(searchTransaction.toLowerCase()) ||
           t.id.toLowerCase().includes(searchTransaction.toLowerCase());
  });

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-200 ${
      theme === "dark" ? "theme-dark bg-stone-950" : "bg-neutral-100"
    }`}>
      {theme === "dark" && (
        <style>{`
          .theme-dark {
            background-color: #0c0a09 !important;
            color: #f5f5f4 !important;
          }
          .theme-dark main {
            background-color: #0c0a09 !important;
            color: #f5f5f4 !important;
          }
          .theme-dark .bg-white {
            background-color: #1c1917 !important;
            color: #f5f5f4 !important;
          }
          .theme-dark .bg-neutral-50 {
            background-color: #171513 !important;
            color: #f5f5f4 !important;
          }
          .theme-dark .border-neutral-200,
          .theme-dark .border-neutral-100,
          .theme-dark .border-neutral-300,
          .theme-dark .border-b,
          .theme-dark .border-t,
          .theme-dark .border {
            border-color: #2e2a24 !important;
          }
          .theme-dark .text-neutral-900,
          .theme-dark .text-neutral-950,
          .theme-dark .text-neutral-800,
          .theme-dark .text-neutral-700 {
            color: #f5f5f4 !important;
          }
          .theme-dark .text-neutral-500,
          .theme-dark .text-neutral-400 {
            color: #a8a29e !important;
          }
          .theme-dark input, .theme-dark select, .theme-dark textarea {
            background-color: #292524 !important;
            border-color: #44403c !important;
            color: #ffffff !important;
          }
          .theme-dark input::placeholder {
            color: #78716c !important;
          }
          .theme-dark select option {
            background-color: #1c1917 !important;
            color: #ffffff !important;
          }
          .theme-dark .bg-neutral-100 {
            background-color: #1c1917 !important;
            color: #f5f5f4 !important;
          }
          .theme-dark table th {
            background-color: #171513 !important;
            color: #a8a29e !important;
            border-color: #2e2a24 !important;
          }
          .theme-dark table td {
            border-color: #2e2a24 !important;
          }
          .theme-dark tr:hover {
            background-color: #292524 !important;
          }
          .theme-dark .shadow-sm {
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.5) !important;
          }
        `}</style>
      )}
      
      {/* Sidebar navigation */}
      <aside className="w-64 bg-neutral-900 text-white flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-neutral-900 font-bold font-serif text-lg">
              T
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-tight block">Topota Panel</span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase">Enterprise v1.2</span>
            </div>
          </div>

          {/* User profile card */}
          <div className="p-4 bg-white/5 mx-3 mt-4 rounded-xl border border-white/5 space-y-2">
            <div>
              <p className="text-xs font-semibold truncate text-neutral-200">{userName}</p>
              <p className="text-[10px] text-neutral-400 truncate font-light">{userEmail}</p>
            </div>
            <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold border rounded-full uppercase tracking-wider ${getRoleBadgeColor(currentRole)}`}>
              {getRoleLabel(currentRole)}
            </span>
          </div>

          {/* Nav list */}
          <nav id="tour-sidebar-nav" className="mt-6 px-3 space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === "overview" 
                  ? "bg-white/10 text-white" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Ikhtisar & Tren
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === "inventory" 
                  ? "bg-white/10 text-white" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              Kelola Inventaris
            </button>

            <button
              onClick={() => setActiveTab("suppliers")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === "suppliers" 
                  ? "bg-white/10 text-white" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              Kelola Supplier
            </button>

            <button
              onClick={() => setActiveTab("feedback")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === "feedback" 
                  ? "bg-white/10 text-white" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              Customer Feedback
            </button>

            <button
              onClick={() => setActiveTab("transactions")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === "transactions" 
                  ? "bg-white/10 text-white" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              Arsip Penjualan
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === "reports" 
                  ? "bg-white/10 text-white" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              Laporan Otomatis
            </button>

            <button
              onClick={() => setActiveTab("landing")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === "landing" 
                  ? "bg-white/10 text-white" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Settings2 className="w-4 h-4 shrink-0" />
              Konten Landing Page
            </button>

            <button
              onClick={() => setActiveTab("rbac")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === "rbac" 
                  ? "bg-white/10 text-white" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              Akses & Peran (RBAC)
            </button>

            <button
              id="tour-sidebar-settings"
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === "settings" 
                  ? "bg-white/10 text-white" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              Pengaturan Aplikasi
            </button>
          </nav>
        </div>

        {/* Footer logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-xs font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            Keluar Dasbor
          </button>
        </div>
      </aside>

      {/* Main page content area */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        
        {/* Top bar header */}
        <header className={`h-20 border-b px-8 flex items-center justify-between shrink-0 transition-colors duration-200 ${
          theme === "dark" 
            ? "bg-neutral-900 border-neutral-800 text-white" 
            : "bg-white border-neutral-200 text-neutral-900"
        }`}>
          <div>
            <h2 className={`font-serif text-xl font-bold capitalize ${
              theme === "dark" ? "text-white" : "text-neutral-900"
            }`}>
              {activeTab === "overview" && "Ikhtisar Bisnis & Analitik Real-time"}
              {activeTab === "inventory" && "Manajemen Inventaris & Stok"}
              {activeTab === "suppliers" && "Kelola Data Supplier & Rantai Pasok"}
              {activeTab === "feedback" && "Customer Feedback & CRM Submissions"}
              {activeTab === "transactions" && "Arsip Transaksi Pelanggan"}
              {activeTab === "reports" && "Pembuat Laporan Bulanan Otomatis"}
              {activeTab === "landing" && "Kustomisasi Desain Landing Page"}
              {activeTab === "rbac" && "Manajemen Hak Akses & Peran Pengguna"}
              {activeTab === "settings" && "Pengaturan Sistem & Sinkronisasi Data"}
            </h2>
            <p className="text-xs text-neutral-400">
              Waktu Sistem: {new Date().toLocaleDateString("id-ID")} - Keamanan data dilindungi enkripsi standard
            </p>
          </div>

          {/* Quick notification center & Theme Toggle */}
          <div className="flex items-center gap-4">
            <button
              id="tour-theme-toggle"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition flex items-center justify-center ${
                theme === "dark" 
                  ? "bg-stone-800 border-stone-700 text-amber-400 hover:bg-stone-700" 
                  : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              }`}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {lowStockItems.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lowStockItems.length} Stok Rendah!
              </div>
            )}
            <span className="text-xs text-neutral-400 font-mono">
              Role: <span className="font-bold text-neutral-700 uppercase">{currentRole}</span>
            </span>
          </div>
        </header>

        {/* Dynamic Inner Tab Content */}
        <div className="p-8 flex-1 space-y-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              
              {/* Customizable Widgets Header & Controller */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-200 ${
                theme === "dark" ? "bg-neutral-800/50 border-neutral-700" : "bg-neutral-50/50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${theme === "dark" ? "bg-neutral-800 text-stone-200" : "bg-white text-neutral-800"} border border-neutral-200 dark:border-neutral-700`}>
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${theme === "dark" ? "text-stone-100" : "text-neutral-800"}`}>Dasbor Widget Kustom</h3>
                    <p className="text-xs text-neutral-400">Pilih, urutkan, dan pin indikator kinerja utama (KPI) yang ingin Anda pantau secara cepat.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsWidgetModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-neutral-950 dark:bg-stone-100 hover:bg-neutral-800 dark:hover:bg-stone-200 text-white dark:text-neutral-950 rounded-xl text-xs font-semibold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Settings2 className="w-4 h-4" />
                  Kustomisasi Widget ({pinnedWidgetIds.length} Pinned)
                </button>
              </div>

              {/* Dynamic KPI Metric Cards Grid */}
              {pinnedSmallWidgets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pinnedSmallWidgets.map(widget => {
                    if (widget.id === "total_revenue") {
                      return (
                        <div key={widget.id} className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-250 ${
                          theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
                        }`}>
                          <div>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Pendapatan Total</p>
                            <p className={`text-2xl font-bold mt-1.5 ${theme === "dark" ? "text-white" : "text-neutral-950"}`}>{formatRupiah(totalRevenue)}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                              <TrendingUp className="w-3 h-3" /> Real-time database
                            </p>
                          </div>
                          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    }
                    if (widget.id === "total_orders") {
                      return (
                        <div key={widget.id} className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-250 ${
                          theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
                        }`}>
                          <div>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Total Transaksi</p>
                            <p className={`text-2xl font-bold mt-1.5 ${theme === "dark" ? "text-white" : "text-neutral-950"}`}>{totalOrders} order</p>
                            <p className="text-[10px] text-neutral-500 font-medium mt-1">Pembayaran Digital Sukses</p>
                          </div>
                          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
                            <Receipt className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    }
                    if (widget.id === "low_stock_items") {
                      return (
                        <div key={widget.id} className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-250 ${
                          theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
                        }`}>
                          <div>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Stok Rendah</p>
                            <p className="text-2xl font-bold text-red-600 mt-1.5">{lowStockItems.length} item</p>
                            <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Perlu restok segera
                            </p>
                          </div>
                          <div className="p-3 bg-red-500/10 rounded-xl text-red-600 animate-pulse">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    }
                    if (widget.id === "inventory_value") {
                      return (
                        <div key={widget.id} className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-250 ${
                          theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
                        }`}>
                          <div>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Nilai Inventaris Aktif</p>
                            <p className={`text-2xl font-bold mt-1.5 ${theme === "dark" ? "text-white" : "text-neutral-950"}`}>{formatRupiah(totalInventoryValue)}</p>
                            <p className="text-[10px] text-neutral-500 font-medium mt-1">Aset Produk Terdaftar</p>
                          </div>
                          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600">
                            <Database className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    }
                    if (widget.id === "total_products") {
                      return (
                        <div key={widget.id} className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-250 ${
                          theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
                        }`}>
                          <div>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Varian Produk</p>
                            <p className={`text-2xl font-bold mt-1.5 ${theme === "dark" ? "text-white" : "text-neutral-950"}`}>{products.length} SKU</p>
                            <p className="text-[10px] text-neutral-500 font-medium mt-1">Katalog Produk Aktif</p>
                          </div>
                          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
                            <Package className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    }
                    if (widget.id === "total_suppliers") {
                      return (
                        <div key={widget.id} className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-250 ${
                          theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
                        }`}>
                          <div>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Supplier Mitra</p>
                            <p className={`text-2xl font-bold mt-1.5 ${theme === "dark" ? "text-white" : "text-neutral-950"}`}>{suppliers.length} Supplier</p>
                            <p className="text-[10px] text-neutral-500 font-medium mt-1">Rantai Pasokan Terintegrasi</p>
                          </div>
                          <div className="p-3 bg-teal-500/10 rounded-xl text-teal-600">
                            <Truck className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {/* Dynamic Interactive Widgets Grid */}
              {pinnedMediumWidgets.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pinnedMediumWidgets.map(widget => {
                    if (widget.id === "top_products_list") {
                      const topProds = getTopProducts();
                      return (
                        <div key={widget.id} className={`p-6 rounded-2xl border shadow-sm space-y-4 flex flex-col justify-between transition-all duration-250 ${
                          theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-neutral-200 text-neutral-900"
                        }`}>
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs uppercase tracking-wide text-neutral-400">Produk Terlaris</h4>
                              <span className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 rounded-full font-bold">Top 3</span>
                            </div>
                            <div className="mt-4 space-y-3">
                              {topProds.length === 0 ? (
                                <p className="text-xs text-neutral-400 italic py-2">Belum ada data penjualan.</p>
                              ) : (
                                topProds.map((item, idx) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold">
                                      <span className="truncate max-w-[150px]">{item.name}</span>
                                      <span className="text-neutral-400 font-normal">{item.quantity} terjual ({formatRupiah(item.revenue)})</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className="bg-neutral-950 dark:bg-neutral-300 h-full rounded-full" 
                                        style={{ width: `${Math.min(100, (item.quantity / Math.max(...topProds.map(x => x.quantity), 1)) * 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (widget.id === "recent_transactions_list") {
                      return (
                        <div key={widget.id} className={`p-6 rounded-2xl border shadow-sm space-y-4 flex flex-col justify-between transition-all duration-250 ${
                          theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-neutral-200 text-neutral-900"
                        }`}>
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs uppercase tracking-wide text-neutral-400">Feed Transaksi Terbaru</h4>
                              <button 
                                onClick={() => setActiveTab("transactions")}
                                className="text-[10px] text-neutral-500 hover:text-neutral-950 dark:hover:text-white font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                Lihat Semua <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div className="mt-4 space-y-3">
                              {transactions.slice(0, 3).length === 0 ? (
                                <p className="text-xs text-neutral-400 italic py-2">Belum ada transaksi.</p>
                              ) : (
                                transactions.slice(0, 3).map((trx) => (
                                  <div key={trx.id} className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-100 dark:border-neutral-700/50 last:border-0">
                                    <div className="min-w-0 flex-1 pr-2">
                                      <p className="font-bold truncate">{trx.customerName || "Walk-In Customer"}</p>
                                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">ID: {trx.id.substring(0, 8)}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="font-semibold text-neutral-800 dark:text-neutral-200">{formatRupiah(trx.totalAmount)}</p>
                                      <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mt-0.5 ${
                                        trx.paymentStatus === "success" 
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" 
                                          : trx.paymentStatus === "pending"
                                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                          : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                                      }`}>
                                        {trx.paymentStatus}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (widget.id === "low_stock_quick_alert") {
                      return (
                        <div key={widget.id} className={`p-6 rounded-2xl border shadow-sm space-y-4 flex flex-col justify-between transition-all duration-250 ${
                          theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-neutral-200 text-neutral-900"
                        }`}>
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs uppercase tracking-wide text-neutral-400">Pusat Alergi Stok Rendah</h4>
                              <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">Stok Kritis</span>
                            </div>
                            <div className="mt-4 space-y-3">
                              {lowStockItems.slice(0, 3).length === 0 ? (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold py-2">Semua stok produk dalam kondisi aman!</p>
                              ) : (
                                lowStockItems.slice(0, 3).map((p) => (
                                  <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-neutral-100 dark:border-neutral-700/50 last:border-0">
                                    <div className="min-w-0 flex-1 pr-2">
                                      <p className="font-bold truncate">{p.name}</p>
                                      <p className="text-[10px] text-red-500 font-semibold mt-0.5">Sisa: {p.stock} (Min: {p.lowStockThreshold})</p>
                                    </div>
                                    {canEditProducts ? (
                                      <button
                                        onClick={() => handleWidgetQuickRestock(p.id, 10)}
                                        className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-neutral-900 text-white rounded text-[10px] font-semibold transition shrink-0 cursor-pointer"
                                      >
                                        Restok (+10)
                                      </button>
                                    ) : (
                                      <span className="text-[9px] text-neutral-400 italic">No access</span>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {/* Customizable Widgets Modal */}
              {isWidgetModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors duration-200 ${
                    theme === "dark" ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-neutral-200 text-neutral-900"
                  }`}>
                    {/* Modal Header */}
                    <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-800 dark:text-white">
                          <Settings2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold">Kustomisasi Dasbor Widget</h3>
                          <p className="text-xs text-neutral-400">Atur indikator KPI dan modul yang ingin ditampilkan di halaman depan.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsWidgetModalOpen(false)}
                        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer text-neutral-400 hover:text-neutral-600 dark:hover:text-stone-200"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 overflow-y-auto space-y-4 flex-1">
                      <div className="grid grid-cols-1 gap-3">
                        {ALL_WIDGETS.map((widget) => {
                          const isPinned = pinnedWidgetIds.includes(widget.id);
                          const pinIndex = pinnedWidgetIds.indexOf(widget.id);
                          return (
                            <div 
                              key={widget.id}
                              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                isPinned 
                                  ? theme === "dark" ? "bg-neutral-800/80 border-neutral-700" : "bg-neutral-50/80 border-neutral-200"
                                  : theme === "dark" ? "bg-neutral-900/40 border-neutral-800/60 opacity-60" : "bg-neutral-50/20 border-neutral-100 opacity-60"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs">{widget.title}</span>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                    widget.category === "Keuangan" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" :
                                    widget.category === "Inventaris" ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400" :
                                    widget.category === "Transaksi" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400" :
                                    "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400"
                                  }`}>
                                    {widget.category}
                                  </span>
                                  <span className="text-[8px] font-mono bg-neutral-100 dark:bg-neutral-700 text-neutral-500 px-1.5 py-0.5 rounded">
                                    {widget.size === "small" ? "Card KPI" : "Interactive Panel"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">{widget.description}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Reordering Buttons */}
                                {isPinned && (
                                  <div className="flex items-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                                    <button
                                      disabled={pinIndex === 0}
                                      onClick={() => handleMoveWidget(widget.id, "up")}
                                      className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-20 transition cursor-pointer"
                                      title="Pindahkan ke Atas"
                                    >
                                      ▲
                                    </button>
                                    <span className="text-[10px] font-bold text-neutral-400 px-1">{pinIndex + 1}</span>
                                    <button
                                      disabled={pinIndex === pinnedWidgetIds.length - 1}
                                      onClick={() => handleMoveWidget(widget.id, "down")}
                                      className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-20 transition cursor-pointer"
                                      title="Pindahkan ke Bawah"
                                    >
                                      ▼
                                    </button>
                                  </div>
                                )}

                                {/* Pin Toggle Button */}
                                <button
                                  onClick={() => handleToggleWidget(widget.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    isPinned 
                                      ? "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400" 
                                      : "bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-neutral-900"
                                  }`}
                                >
                                  {isPinned ? "Lepas Pin" : "Pin Widget"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <button
                        onClick={handleResetWidgets}
                        className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-stone-200 transition font-semibold"
                      >
                        Reset ke Pengaturan Awal
                      </button>
                      <button
                        onClick={() => setIsWidgetModalOpen(false)}
                        className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-neutral-950 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Selesai
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Low stock Alerts & Quick Restock */}
              {lowStockItems.length > 0 && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-sm">Pusat Peringatan Stok Rendah</h3>
                      <p className="text-xs text-neutral-500">Item berikut memiliki stok di bawah atau sama dengan ambang batas peringatan yang ditetapkan.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowStockItems.map(p => (
                      <div key={p.id} className="bg-white p-4 rounded-xl border border-neutral-200 flex justify-between items-center shadow-xs">
                        <div>
                          <p className="text-sm font-semibold text-neutral-800 truncate max-w-[150px]">{p.name}</p>
                          <p className="text-xs text-neutral-500">Stok saat ini: <strong className="text-red-500">{p.stock}</strong> (Ambang: {p.lowStockThreshold})</p>
                        </div>

                        {canEditProducts ? (
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="number" 
                              min="1"
                              placeholder="+Qty" 
                              value={stockQuickInput[p.id] || ""}
                              onChange={(e) => setStockQuickInput(prev => ({ ...prev, [p.id]: parseInt(e.target.value) }))}
                              className="w-14 px-2 py-1 text-xs border border-neutral-300 rounded text-center focus:outline-none focus:border-neutral-800"
                            />
                            <button
                              onClick={() => handleQuickRestock(p.id)}
                              className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition"
                            >
                              Restok
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-neutral-400 italic">Hanya Editor</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analytical Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Chart */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-neutral-900">Perkembangan Omset Pendapatan</h3>
                    <p className="text-xs text-neutral-500">Siklus omset bulanan yang tercatat dalam Firestore Database</p>
                  </div>
                  <div className="h-84">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getSalesTrendData()}>
                        <defs>
                          <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme === "dark" ? "#e5e5e5" : "#171717"} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={theme === "dark" ? "#e5e5e5" : "#171717"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(val) => `Rp ${val / 1000000}M`} />
                        <Tooltip formatter={(val) => [formatRupiah(val as number), "Pendapatan"]} />
                        <Area type="monotone" dataKey="Pendapatan" stroke={theme === "dark" ? "#e5e5e5" : "#171717"} strokeWidth={2.5} fillOpacity={1} fill="url(#colorPendapatan)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Best Sellers and Category Splits combined */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-neutral-900">Volume Terjual per Kategori</h3>
                    <p className="text-xs text-neutral-500">Breakdown jumlah unit barang terjual berdasarkan kategori</p>
                  </div>
                  <div className="h-84">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getCategorySalesData()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="Terjual" fill={theme === "dark" ? "#e5e5e5" : "#171717"} radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Inventory Fluctuations Chart */}
              <div id="tour-chart-fluctuations" className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-neutral-900">Fluktuasi Tingkat Inventaris (30 Hari Terakhir)</h3>
                    <p className="text-xs text-neutral-500">Analisis pergerakan volume stok total secara harian berdasarkan real-time transaksi penjualan dan log pembaruan</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                      <span className="text-xs font-semibold text-neutral-600">Level Stok Aktif: {products.reduce((acc, p) => acc + p.stock, 0)} unit</span>
                    </div>
                  </div>
                </div>
                <div className="h-84">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getInventoryFluctuationsData()} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#2e2a24" : "#f0f0f0"} />
                      <XAxis 
                        dataKey="name" 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: theme === "dark" ? '#a8a29e' : '#888888', fontSize: 10 }}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: theme === "dark" ? '#a8a29e' : '#888888', fontSize: 11 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === "dark" ? "#1c1917" : "#ffffff", 
                          borderColor: theme === "dark" ? "#2e2a24" : "#e5e5e5",
                          borderRadius: '12px',
                          color: theme === "dark" ? "#f5f5f4" : "#171717"
                        }}
                        labelStyle={{ fontWeight: 'bold', color: theme === "dark" ? "#ffffff" : "#171717" }}
                        itemStyle={{ color: "#059669" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Tingkat Stok" 
                        stroke="#059669" 
                        strokeWidth={3} 
                        dot={{ r: 2.5, stroke: '#059669', strokeWidth: 1, fill: '#ffffff' }}
                        activeDot={{ r: 5, strokeWidth: 0, fill: '#059669' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INVENTORY */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              
              {/* Filter and control panel */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div ref={searchContainerRef} className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Cari SKU, Nama, atau Kategori (Fuzzy)..."
                    value={searchProduct}
                    onFocus={() => setIsPredictionsOpen(true)}
                    onChange={(e) => {
                      setSearchProduct(e.target.value);
                      setIsPredictionsOpen(true);
                    }}
                    className="w-full pl-10 pr-10 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 bg-white transition"
                  />
                  {searchProduct && (
                    <button
                      onClick={() => setSearchProduct("")}
                      className="absolute right-3 top-2.5 p-0.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition"
                      title="Bersihkan Pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Predictive search suggestions dropdown */}
                  {isPredictionsOpen && searchProduct.trim() && (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/60 max-h-80 overflow-y-auto">
                      <div className="px-3.5 py-1.5 bg-neutral-50 dark:bg-neutral-800/40 text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex justify-between items-center">
                        <span>Prediksi Hasil Pencarian</span>
                        <span className="text-[8px] font-mono lowercase border border-neutral-200/50 dark:border-neutral-700 px-1 rounded">fuzzy cocok</span>
                      </div>
                      
                      {predictiveSuggestions.length === 0 ? (
                        <div className="p-4 text-center text-xs text-neutral-400 italic">
                          Tidak ada produk yang cocok
                        </div>
                      ) : (
                        predictiveSuggestions.map(({ product: p, score }) => {
                          const isOutOfStock = p.stock === 0;
                          const isLowStock = !isOutOfStock && p.stock <= p.lowStockThreshold;

                          return (
                            <div 
                              key={p.id}
                              onClick={() => {
                                setSearchProduct(p.name);
                                setIsPredictionsOpen(false);
                              }}
                              className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer transition text-left"
                            >
                              <img 
                                src={p.imageUrl} 
                                alt={p.name} 
                                className="w-9 h-9 object-cover rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{p.name}</p>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md shrink-0">
                                    {p.category}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                  <p className="text-[10px] text-neutral-400 font-mono truncate">
                                    SKU: <span className="font-semibold text-neutral-600 dark:text-neutral-300">{p.id}</span>
                                  </p>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(p.price)}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                      isOutOfStock 
                                        ? "bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:border-red-900/50" 
                                        : isLowStock 
                                          ? "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50" 
                                          : "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                                    }`}>
                                      {p.stock} unit
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      
                      <div className="px-3.5 py-1.5 bg-neutral-50 dark:bg-neutral-800/40 text-[9px] text-neutral-400 text-center">
                        Tekan opsi untuk menyaring daftar tabel secara instan
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex w-full md:w-auto gap-3 shrink-0">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3.5 py-2 border border-neutral-200 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="Makanan Utama">Makanan Utama</option>
                    <option value="Camilan">Camilan</option>
                    <option value="Minuman">Minuman</option>
                  </select>

                  <button
                    onClick={exportProductsExcel}
                    className="flex items-center gap-1.5 px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold transition"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Excel
                  </button>

                  {canEditProducts && (
                    <button
                      id="tour-csv-import"
                      onClick={() => {
                        setCsvError("");
                        setCsvParsedData([]);
                        setCsvSuccessCount(null);
                        setIsCsvModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold transition"
                    >
                      <Upload className="w-4 h-4 text-emerald-600" />
                      Impor CSV (Bulk)
                    </button>
                  )}

                  {canEditProducts && (
                    <button
                      onClick={() => {
                        setTerminalSearchInput("");
                        setTerminalScannedProduct(null);
                        setTerminalScanError("");
                        setTerminalSuccessMsg("");
                        setIsOpnameTerminalOpen(true);
                        setTimeout(() => {
                          const sInput = document.getElementById("terminal_scan_input");
                          if (sInput) sInput.focus();
                        }, 300);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold transition"
                    >
                      <Barcode className="w-4 h-4 text-amber-600" />
                      Stock Opname (Scanner)
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (!canEditProducts) {
                        alert("Peran Anda tidak diizinkan untuk membuat produk.");
                        return;
                      }
                      setEditingProduct(null);
                      setProductForm({
                        name: "",
                        description: "",
                        price: 0,
                        stock: 0,
                        lowStockThreshold: 5,
                        imageUrl: "",
                        category: "Makanan Utama",
                        supplierId: "",
                        status: "Aktif"
                      });
                      setIsProductModalOpen(true);
                    }}
                    disabled={!canEditProducts}
                    className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold transition ${
                      canEditProducts 
                        ? "bg-neutral-950 hover:bg-neutral-800 text-white" 
                        : "bg-neutral-100 border border-neutral-200 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Produk
                  </button>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-400 text-[10px] font-bold uppercase tracking-wider border-b border-neutral-200">
                        {canEditProducts && (
                          <th className="p-4 pl-6 w-12 text-center">
                            <input 
                              type="checkbox"
                              checked={isAllFilteredSelected}
                              ref={el => {
                                if (el) {
                                  el.indeterminate = isSomeFilteredSelected;
                                }
                              }}
                              onChange={handleSelectAllToggle}
                              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                            />
                          </th>
                        )}
                        <th className={`p-4 ${canEditProducts ? "" : "pl-6"}`}>Foto</th>
                        <th className="p-4">Nama Produk</th>
                        <th className="p-4">Kategori</th>
                        <th className="p-4">Harga Unit</th>
                        <th className="p-4">Stok Terkini</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Ambang Batas</th>
                        <th className="p-4 text-center">Terjual</th>
                        <th className="p-4 pr-6 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs text-neutral-600">
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={canEditProducts ? 10 : 9} className="text-center py-16 text-neutral-400 font-medium">
                            Tidak ditemukan produk.
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map((p) => {
                          const isOutOfStock = p.stock === 0;
                          const isLowStock = !isOutOfStock && p.stock <= p.lowStockThreshold;
                          const isSelected = selectedProductIds.includes(p.id);

                          return (
                            <tr key={p.id} className={`hover:bg-neutral-50/50 transition ${isSelected ? "bg-neutral-50/70" : ""}`}>
                              {canEditProducts && (
                                <td className="p-4 pl-6 text-center">
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectRowToggle(p.id)}
                                    className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                                  />
                                </td>
                              )}
                              <td className={`p-4 ${canEditProducts ? "" : "pl-6"}`}>
                                <div className="relative group inline-block">
                                  <img 
                                    src={p.imageUrl} 
                                    alt={p.name} 
                                    className="w-11 h-11 object-cover rounded-lg border border-neutral-100 bg-neutral-100 cursor-zoom-in transition-all duration-200 hover:scale-105 hover:shadow-md"
                                  />
                                  
                                  {/* Enlarged Floating Hover Preview */}
                                  <div className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 w-56 bg-white rounded-2xl border border-neutral-200 shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-left flex flex-col p-3 space-y-2.5">
                                    <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-neutral-100 bg-neutral-50">
                                      <img 
                                        src={p.imageUrl} 
                                        alt={p.name} 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="px-1">
                                      <p className="font-semibold text-neutral-900 text-xs truncate">{p.name}</p>
                                      <div className="flex items-center justify-between mt-1 text-[10px]">
                                        <span className="text-neutral-500 font-medium">{p.category}</span>
                                        <span className="text-neutral-950 font-bold font-mono">{formatRupiah(p.price)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="font-semibold text-neutral-900">{p.name}</p>
                                <p className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate max-w-[150px]">{p.id}</p>
                              </td>
                              <td className="p-4">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 border border-neutral-200/50 text-neutral-800">
                                  {p.category}
                                </span>
                              </td>
                              <td className="p-4 font-semibold text-neutral-800">
                                {formatRupiah(p.price)}
                              </td>
                              <td className="p-4">
                                <span className={`font-bold ${isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-neutral-800"}`}>
                                  {p.stock}
                                </span>
                                {isOutOfStock && <span className="text-[9px] font-bold text-red-500 uppercase ml-1.5">HABIS</span>}
                                {isLowStock && <span className="text-[9px] font-bold text-amber-500 uppercase ml-1.5">RESTOR</span>}
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  p.status === "Nonaktif" 
                                    ? "bg-neutral-50 border-neutral-200 text-neutral-400" 
                                    : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${p.status === "Nonaktif" ? "bg-neutral-400" : "bg-emerald-600"}`} />
                                  {p.status || "Aktif"}
                                </span>
                              </td>
                              <td className="p-4 font-mono">
                                {p.lowStockThreshold}
                              </td>
                              <td className="p-4 text-center font-semibold font-mono">
                                {p.soldCount || 0}
                              </td>
                              <td className="p-4 pr-6 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedScanProduct(p)}
                                    title="Tampilkan QR & Barcode Produk"
                                    className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-950 transition"
                                  >
                                    <QrCode className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openEditProduct(p)}
                                    disabled={!canEditProducts}
                                    title={!canEditProducts ? "Hak akses Anda tidak mencukupi" : "Ubah Produk"}
                                    className={`p-1.5 rounded-lg border transition ${
                                      canEditProducts
                                        ? "border-neutral-200 hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950"
                                        : "border-neutral-100 text-neutral-300 cursor-not-allowed"
                                    }`}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    disabled={!canEditProducts}
                                    title={!canEditProducts ? "Hak akses Anda tidak mencukupi" : "Hapus Produk"}
                                    className={`p-1.5 rounded-lg border transition ${
                                      canEditProducts
                                        ? "border-red-100 hover:bg-red-50 text-red-500 hover:text-red-600"
                                        : "border-neutral-100 text-neutral-300 cursor-not-allowed"
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Batch Actions Floating Bar */}
              {canEditProducts && selectedProductIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-y-0 -translate-x-1/2 z-50 w-[90%] max-w-2xl bg-neutral-900/95 dark:bg-neutral-950/95 backdrop-blur-md text-white px-6 py-4 rounded-3xl shadow-2xl border border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
                  <div className="flex items-center gap-3">
                    <div className="bg-neutral-800 text-stone-200 p-2 rounded-xl border border-neutral-700">
                      <Package className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-100 uppercase tracking-wider">Operasi Masal Inventaris</p>
                      <p className="text-[11px] text-neutral-400 font-medium">
                        <span className="font-bold text-white bg-neutral-800 px-1.5 py-0.5 rounded mr-1">{selectedProductIds.length}</span> 
                        produk dipilih untuk pemrosesan kelompok.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleBulkUpdateStatus("Aktif")}
                      disabled={isBatchActionLoading}
                      className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-neutral-700"
                    >
                      Aktifkan
                    </button>
                    <button
                      onClick={() => handleBulkUpdateStatus("Nonaktif")}
                      disabled={isBatchActionLoading}
                      className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-500 hover:text-amber-400 disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-neutral-700"
                    >
                      Nonaktifkan
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={isBatchActionLoading}
                      className="px-3.5 py-2 bg-red-950/80 hover:bg-red-900/90 text-red-400 disabled:opacity-50 text-[11px] font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-red-900/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Masal
                    </button>
                    <button
                      onClick={() => setSelectedProductIds([])}
                      disabled={isBatchActionLoading}
                      className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition cursor-pointer"
                      title="Batalkan Pilihan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* DATABASE BACKUP & SAFETY SNAPSHOTS */}
              <div id="tour-snapshot" className="bg-neutral-50 rounded-2xl border border-neutral-200 p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-neutral-900 text-white flex items-center justify-center shrink-0">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-serif text-lg font-bold text-neutral-900">Database Safety Snapshots</h3>
                    </div>
                    <p className="text-xs text-neutral-500">Ambil snapshot cadangan instan dari seluruh inventaris produk saat ini ke dalam Firestore koleksi tersembunyi sebagai langkah pengamanan data.</p>
                  </div>

                  {canEditProducts && (
                    <form onSubmit={handleCreateSnapshot} className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Tambahkan catatan snapshot (opsional)..."
                        value={backupNote}
                        onChange={(e) => setBackupNote(e.target.value)}
                        className="px-3 py-2 border border-neutral-200 rounded-xl text-xs bg-white focus:outline-none focus:border-neutral-900 w-full md:w-60"
                        disabled={isBackupLoading}
                      />
                      <button
                        type="submit"
                        disabled={isBackupLoading || products.length === 0}
                        className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition shrink-0 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
                      >
                        <Database className="w-3.5 h-3.5" />
                        Quick Snapshot
                      </button>
                    </form>
                  )}
                </div>

                {backupSuccessMessage && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-medium animate-fade-in">
                    {backupSuccessMessage}
                  </div>
                )}

                {/* Backups List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Daftar Snapshot Tersimpan</h4>
                  
                  {backups.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-2">Belum ada snapshot cadangan yang dibuat. Ambil snapshot pertama Anda untuk mengamankan data inventaris.</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {backups.map((b) => (
                        <div key={b.id} className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3 shadow-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-neutral-800 font-mono truncate max-w-[200px]">{b.note || "Quick Snapshot"}</p>
                              <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(b.createdAt).toLocaleString("id-ID")} oleh {b.createdBy}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded-full text-[10px] text-neutral-600 font-medium font-mono shrink-0">
                              {b.itemCount} menu
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                            <button
                              onClick={() => {
                                alert(
                                  `Isi Snapshot "${b.note}":\n\n` + 
                                  b.products.map(p => `- ${p.name}: Stok ${p.stock} @ ${formatRupiah(p.price)}`).join("\n")
                                );
                              }}
                              className="text-[10px] text-neutral-500 hover:text-neutral-800 font-medium transition"
                            >
                              Lihat Detail Data ({b.products.length} item)
                            </button>

                            {canEditProducts && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRestoreSnapshot(b)}
                                  disabled={isBackupLoading}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold transition"
                                >
                                  Pulihkan Stok
                                </button>
                                <button
                                  onClick={() => handleDeleteSnapshot(b.id)}
                                  className="text-[10px] text-red-600 hover:text-red-800 font-semibold transition"
                                >
                                  Hapus
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TRANSACTIONS */}
          {activeTab === "transactions" && (
            <div className="space-y-6">
              
              {/* Filter and control panel */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Cari transaksi (pelanggan/email/id)..."
                    value={searchTransaction}
                    onChange={(e) => setSearchTransaction(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="flex w-full md:w-auto gap-3 shrink-0">
                  <button
                    onClick={generateSalesLedgerPDF}
                    className="flex items-center gap-1.5 px-4.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    Unduh PDF Keuangan
                  </button>

                  <button
                    onClick={exportTransactionsExcel}
                    className="flex items-center gap-1.5 px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold transition"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Excel Penjualan
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-400 text-[10px] font-bold uppercase tracking-wider border-b border-neutral-200">
                        <th className="p-4 pl-6">ID Transaksi</th>
                        <th className="p-4">Tanggal</th>
                        <th className="p-4">Pelanggan</th>
                        <th className="p-4">Barang Terbeli</th>
                        <th className="p-4">Metode Bayar</th>
                        <th className="p-4">Nominal</th>
                        <th className="p-4 pr-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs text-neutral-600">
                      {filteredTrxHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-16 text-neutral-400 font-medium">
                            Belum ada riwayat transaksi penjualan.
                          </td>
                        </tr>
                      ) : (
                        filteredTrxHistory.map((t) => (
                          <tr key={t.id} className="hover:bg-neutral-50/50 transition">
                            <td className="p-4 pl-6 font-mono text-neutral-800 font-semibold uppercase">
                              {t.id.slice(0, 10)}
                            </td>
                            <td className="p-4 font-mono text-neutral-500">
                              {new Date(t.date).toLocaleString("id-ID")}
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-neutral-900">{t.customerName}</p>
                              <p className="text-[10px] text-neutral-400 truncate max-w-[150px]">{t.customerEmail}</p>
                            </td>
                            <td className="p-4 font-medium text-neutral-800">
                              {t.items.map((item, idx) => (
                                <div key={idx} className="truncate max-w-[200px]">
                                  {item.name} <span className="text-neutral-400 text-[10px]">x{item.quantity}</span>
                                </div>
                              ))}
                            </td>
                            <td className="p-4">
                              <span className="text-xs text-neutral-700">{t.paymentMethod}</span>
                            </td>
                            <td className="p-4 font-bold text-neutral-900">
                              {formatRupiah(t.totalAmount)}
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                                {t.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              
              {/* Selection header */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-neutral-700">Pilih Periode Laporan:</span>
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value as any)}
                    className="px-4 py-2 border border-neutral-200 rounded-xl text-xs bg-white focus:outline-none font-semibold text-neutral-800"
                  >
                    <option value="05">Mei 2026</option>
                    <option value="06">Juni 2026</option>
                    <option value="07">Juli 2026</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={downloadMonthlyReportPDF}
                    className="flex items-center gap-1.5 px-4.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    Unduh PDF Resmi
                  </button>
                </div>
              </div>

              {/* Generated Monthly Report Showcase */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm space-y-8 max-w-4xl mx-auto">
                {/* PDF Replica Header */}
                <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-neutral-400 tracking-wider uppercase font-mono block">DOKUMEN FINANSIAL RESMI</span>
                    <h3 className="font-serif text-2xl font-bold text-neutral-950">TOPOTA.ID FOODS</h3>
                    <p className="text-xs text-neutral-500">Jakarta, Indonesia | www.topota.id</p>
                  </div>
                  <div className="text-right space-y-0.5 font-mono text-[10px] text-neutral-400">
                    <p>ID DOC: REP-{reportMonth}-2026</p>
                    <p>VERSI: 1.0 SECURE</p>
                  </div>
                </div>

                {/* Doc Title */}
                <div className="text-center py-4">
                  <h4 className="font-serif text-xl font-bold text-neutral-900 tracking-tight uppercase">
                    LAPORAN ANALISA KINERJA BULANAN
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">Periode Laporan: <strong className="text-neutral-900">{monthlyReport.periodName}</strong></p>
                </div>

                {/* 2x2 Metric Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Omset Omzet</p>
                    <p className="text-base font-extrabold text-emerald-700 mt-1">{formatRupiah(monthlyReport.totalRevenue)}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Volume Terjual</p>
                    <p className="text-base font-extrabold text-neutral-950 mt-1">{monthlyReport.salesVolume} unit</p>
                  </div>
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Frekuensi Belanja</p>
                    <p className="text-base font-extrabold text-neutral-950 mt-1">{monthlyReport.transactionCount} kali</p>
                  </div>
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Rata-rata Keranjang (AOV)</p>
                    <p className="text-base font-extrabold text-neutral-950 mt-1">{formatRupiah(monthlyReport.averageTicketSize)}</p>
                  </div>
                </div>

                {/* Top Selling lists */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">Peringkat 3 Produk Terlaris Teratas</h5>
                  <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-200">
                    {monthlyReport.bestSellers.length === 0 ? (
                      <p className="p-4 text-xs text-neutral-400 text-center font-medium">Tidak ada transaksi pada periode ini.</p>
                    ) : (
                      monthlyReport.bestSellers.map((item, idx) => (
                        <div key={item.id} className="p-4 flex items-center justify-between text-xs hover:bg-neutral-50 transition">
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-[10px] font-mono">{idx + 1}</span>
                            <span className="font-semibold text-neutral-800">{item.name}</span>
                          </div>
                          <div className="flex gap-8 text-neutral-600 font-mono">
                            <span>{item.quantity} unit</span>
                            <span className="font-bold text-neutral-900">{formatRupiah(item.total)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Ledger entries list */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">Rincian Buku Transaksi</h5>
                  <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-neutral-50 text-neutral-400 font-bold uppercase border-b border-neutral-200">
                          <th className="p-3 pl-4">Tanggal</th>
                          <th className="p-3">Pelanggan</th>
                          <th className="p-3">Item Pembelian</th>
                          <th className="p-3 text-right pr-4">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-600">
                        {monthlyReport.rawTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center p-6 text-neutral-400 font-medium">Belum ada transaksi.</td>
                          </tr>
                        ) : (
                          monthlyReport.rawTransactions.map(t => (
                            <tr key={t.id}>
                              <td className="p-3 pl-4 font-mono text-neutral-400">{new Date(t.date).toLocaleDateString("id-ID")}</td>
                              <td className="p-3 font-semibold text-neutral-800">{t.customerName}</td>
                              <td className="p-3">{t.items.map(i => `${i.name} (x${i.quantity})`).join(", ")}</td>
                              <td className="p-3 text-right pr-4 font-bold text-neutral-900">{formatRupiah(t.totalAmount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sign-off */}
                <div className="pt-8 border-t border-neutral-200 flex justify-between text-neutral-500 text-[10px] leading-relaxed">
                  <div>
                    <p>Laporan ini dihasilkan secara otomatis dan sah oleh</p>
                    <p>Sistem Database topota.id Firestore.</p>
                  </div>
                  <div className="text-right">
                    <p>Operator: {userName}</p>
                    <p>Tanda Tangan Elektronik Aktif - Status: Terverifikasi</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: LANDING EDITOR */}
          {activeTab === "landing" && (
            <div className="space-y-6">
              
              {!canEditLanding && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-semibold text-amber-700 leading-relaxed">
                  Perhatian: Peran akun Anda saat ini ({getRoleLabel(currentRole)}) hanya memiliki izin <strong>Lihat-Lihat (Read-Only)</strong>. Anda dapat melihat pengaturan formulir di bawah ini, namun tidak diizinkan untuk menyimpan atau melakukan perubahan ke database real-time.
                </div>
              )}

              {isLandingSaved && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs font-semibold text-emerald-700 flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5" />
                  Berhasil! Konten landing page telah diperbarui di Firestore dan langsung berubah secara real-time untuk semua pengunjung.
                </div>
              )}

              {landingForm && (
                <form onSubmit={handleSaveLanding} className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Nama Brand Utama</label>
                      <input 
                        type="text"
                        disabled={!canEditLanding}
                        value={landingForm.brandName}
                        onChange={(e) => setLandingForm({ ...landingForm, brandName: e.target.value })}
                        className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Tombol Call-To-Action (CTA)</label>
                      <input 
                        type="text"
                        disabled={!canEditLanding}
                        value={landingForm.ctaText}
                        onChange={(e) => setLandingForm({ ...landingForm, ctaText: e.target.value })}
                        className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Judul Utama Hero (Promosi Utama)</label>
                    <input 
                      type="text"
                      disabled={!canEditLanding}
                      value={landingForm.heroTitle}
                      onChange={(e) => setLandingForm({ ...landingForm, heroTitle: e.target.value })}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Sub-Judul Hero</label>
                    <textarea 
                      rows={3}
                      disabled={!canEditLanding}
                      value={landingForm.heroSubtitle}
                      onChange={(e) => setLandingForm({ ...landingForm, heroSubtitle: e.target.value })}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">URL Foto Hero Background</label>
                    <input 
                      type="text"
                      disabled={!canEditLanding}
                      value={landingForm.heroImageUrl}
                      onChange={(e) => setLandingForm({ ...landingForm, heroImageUrl: e.target.value })}
                      className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 text-xs font-mono"
                    />
                  </div>

                  <div className="border-t border-neutral-100 pt-6 space-y-4">
                    <h4 className="font-serif text-base font-bold text-neutral-900">Cerita Brand (Tentang Kami)</h4>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Kisah Narasi</label>
                      <textarea 
                        rows={5}
                        disabled={!canEditLanding}
                        value={landingForm.aboutText}
                        onChange={(e) => setLandingForm({ ...landingForm, aboutText: e.target.value })}
                        className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 text-xs leading-relaxed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">URL Foto Kisah (Tentang Kami)</label>
                      <input 
                        type="text"
                        disabled={!canEditLanding}
                        value={landingForm.aboutImageUrl}
                        onChange={(e) => setLandingForm({ ...landingForm, aboutImageUrl: e.target.value })}
                        className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-6 space-y-4">
                    <h4 className="font-serif text-base font-bold text-neutral-900">Informasi Kontak Bisnis</h4>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Alamat Email Bisnis</label>
                        <input 
                          type="email"
                          disabled={!canEditLanding}
                          value={landingForm.contactEmail}
                          onChange={(e) => setLandingForm({ ...landingForm, contactEmail: e.target.value })}
                          className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Nomor Handphone / Whatsapp</label>
                        <input 
                          type="text"
                          disabled={!canEditLanding}
                          value={landingForm.contactPhone}
                          onChange={(e) => setLandingForm({ ...landingForm, contactPhone: e.target.value })}
                          className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Alamat Fisik Showroom</label>
                        <input 
                          type="text"
                          disabled={!canEditLanding}
                          value={landingForm.contactAddress}
                          onChange={(e) => setLandingForm({ ...landingForm, contactAddress: e.target.value })}
                          className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {canEditLanding && (
                    <div className="pt-4 border-t border-neutral-100 flex justify-end">
                      <button
                        type="submit"
                        className="bg-neutral-950 hover:bg-neutral-800 text-white font-semibold px-6 py-2.5 rounded-xl text-xs tracking-wider uppercase transition shadow-sm"
                      >
                        Simpan Perubahan Landing Page
                      </button>
                    </div>
                  )}

                </form>
              )}

            </div>
          )}

          {/* TAB 6: RBAC MANAGEMENT */}
          {activeTab === "rbac" && (
            <div className="space-y-6">
              
              {!canManageRoles && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-semibold text-amber-700 leading-relaxed">
                  Perhatian: Peran akun Anda saat ini ({getRoleLabel(currentRole)}) hanya memiliki izin <strong>Lihat-Lihat (Read-Only)</strong>. Anda tidak diperkenankan mengubah, mempromosikan, atau menghapus peran user lain demi alasan keamanan sistem.
                </div>
              )}

              {/* Dynamic Granular Role & Permissions Editor */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h4 className="font-serif text-base font-bold text-neutral-900">Konfigurasi Tingkat Akses & Izin Peran Granular</h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      Definisikan hak akses spesifik untuk setiap peran staff (baik peran sistem bawaan maupun peran kustom baru).
                    </p>
                  </div>
                  {canManageRoles && (
                    <button
                      onClick={() => setIsNewRoleModalOpen(true)}
                      className="flex items-center gap-1 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Tambah Peran Kustom
                    </button>
                  )}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {(rolePermissionsForm.length > 0 ? rolePermissionsForm : defaultRolePermissions).map((role) => {
                    const isSystemRole = ["admin", "manager", "viewer"].includes(role.roleId);
                    return (
                      <div 
                        key={role.roleId} 
                        className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                          role.roleId === "admin" 
                            ? "bg-red-50/10 border-red-100" 
                            : role.roleId === "manager"
                            ? "bg-amber-50/10 border-amber-100"
                            : role.roleId === "viewer"
                            ? "bg-blue-50/10 border-blue-100"
                            : "bg-neutral-50/30 border-neutral-200"
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Role Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 w-full">
                              {canManageRoles && !isSystemRole ? (
                                <input
                                  type="text"
                                  value={role.displayName}
                                  onChange={(e) => handleUpdateRoleDisplayName(role.roleId, e.target.value)}
                                  className="font-bold text-neutral-900 bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-neutral-900 focus:outline-none w-full text-xs"
                                  placeholder="Nama Peran"
                                />
                              ) : (
                                <p className="font-bold text-neutral-900 text-xs">{role.displayName}</p>
                              )}
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] text-neutral-400 uppercase bg-neutral-100 px-1.5 py-0.5 rounded">
                                  ID: {role.roleId}
                                </span>
                                {isSystemRole ? (
                                  <span className="text-[9px] text-neutral-400 italic">Sistem Bawaan</span>
                                ) : (
                                  <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded font-semibold">Kustom</span>
                                )}
                              </div>
                            </div>

                            {/* Delete custom role button */}
                            {canManageRoles && !isSystemRole && (
                              <button
                                onClick={() => handleDeleteRole(role.roleId)}
                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0 cursor-pointer"
                                title="Hapus Peran Kustom"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Permissions Checklist */}
                          <div className="border-t border-neutral-100/50 pt-3 space-y-2.5">
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Izin Modul</p>
                            
                            <label className="flex items-center gap-2.5 cursor-pointer text-[11px] text-neutral-700 select-none">
                              <input
                                type="checkbox"
                                disabled={!canManageRoles || role.roleId === "admin"}
                                checked={role.editProducts}
                                onChange={() => handleTogglePermission(role.roleId, "editProducts")}
                                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 disabled:opacity-50"
                              />
                              <span>Kelola & Edit Produk</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer text-[11px] text-neutral-700 select-none">
                              <input
                                type="checkbox"
                                disabled={!canManageRoles || role.roleId === "admin"}
                                checked={role.editSuppliers}
                                onChange={() => handleTogglePermission(role.roleId, "editSuppliers")}
                                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 disabled:opacity-50"
                              />
                              <span>Kelola Supplier Mitra</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer text-[11px] text-neutral-700 select-none">
                              <input
                                type="checkbox"
                                disabled={!canManageRoles || role.roleId === "admin"}
                                checked={role.editLanding}
                                onChange={() => handleTogglePermission(role.roleId, "editLanding")}
                                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 disabled:opacity-50"
                              />
                              <span>Ubah Tampilan Landing Page</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer text-[11px] text-neutral-700 select-none">
                              <input
                                type="checkbox"
                                disabled={!canManageRoles || role.roleId === "admin"}
                                checked={role.manageBackups}
                                onChange={() => handleTogglePermission(role.roleId, "manageBackups")}
                                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 disabled:opacity-50"
                              />
                              <span>Backup & Restore Data</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer text-[11px] text-neutral-700 select-none">
                              <input
                                type="checkbox"
                                disabled={!canManageRoles || role.roleId === "admin"}
                                checked={role.manageRoles}
                                onChange={() => handleTogglePermission(role.roleId, "manageRoles")}
                                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 disabled:opacity-50"
                              />
                              <span>Kelola Hak Akses & Peran User</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer text-[11px] text-neutral-700 select-none">
                              <input
                                type="checkbox"
                                disabled={!canManageRoles || role.roleId === "admin"}
                                checked={role.viewTransactions}
                                onChange={() => handleTogglePermission(role.roleId, "viewTransactions")}
                                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 disabled:opacity-50"
                              />
                              <span>Lihat Transaksi & Finansial</span>
                            </label>
                          </div>
                        </div>

                        {/* Summary Description */}
                        <div className="mt-4 pt-3 border-t border-neutral-100/35 text-[10px] text-neutral-400 italic">
                          {role.roleId === "admin" 
                            ? "Akses kontrol penuh tanpa batasan." 
                            : Object.values(role).filter(v => v === true).length === 0 
                            ? "Akses baca murni (Read-Only)." 
                            : `Akses terbatas dengan ${Object.values(role).filter(v => v === true).length} izin aktif.`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Permissions Save & Reset Controls */}
                {canManageRoles && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-100">
                    <p className="text-[11px] text-neutral-400">
                      * Perubahan display nama dan izin hak akses tidak akan aktif di database real-time sampai Anda mengeklik Simpan Konfigurasi.
                    </p>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button
                        onClick={handleResetRolePermissions}
                        disabled={savePermissionsLoading}
                        className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-600 transition cursor-pointer"
                      >
                        Reset ke Bawaan
                      </button>
                      <button
                        onClick={handleSaveRolePermissions}
                        disabled={savePermissionsLoading}
                        className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        {savePermissionsLoading ? "Menyimpan..." : "Simpan Konfigurasi Izin"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User list from DB */}
              <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-base font-bold text-neutral-900">Daftar Pengguna & Hak Akses Terdaftar</h4>
                    <p className="text-xs text-neutral-400 mt-1">Super Admin diizinkan menambah, mengubah peran, atau menghapus pengguna sistem.</p>
                  </div>
                  {canManageRoles && (
                    <button
                      onClick={() => {
                        setAddUserError("");
                        setIsAddUserModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-wide uppercase transition shadow-xs"
                    >
                      <UserPlus className="w-4 h-4" />
                      Tambah Pengguna Baru
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs text-neutral-600">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-400 font-bold uppercase border-b border-neutral-200">
                        <th className="p-4 pl-6">Pengguna</th>
                        <th className="p-4">Alamat Email</th>
                        <th className="p-4">Tanggal Bergabung</th>
                        <th className="p-4">Peran Saat Ini</th>
                        <th className="p-4 pr-6 text-right">Ubah Peran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {userProfiles.map(u => (
                        <tr key={u.uid} className="hover:bg-neutral-50/50 transition">
                          <td className="p-4 pl-6">
                            <span className="font-semibold text-neutral-900">{u.displayName}</span>
                            {u.email === "sucipto.officiall@gmail.com" && <span className="text-[9px] font-bold text-amber-700 border border-amber-200 bg-amber-50 px-1.5 py-0.5 rounded ml-2 animate-pulse">SUPER ADMIN</span>}
                            {u.uid.startsWith("demo-") && <span className="text-[9px] font-bold text-neutral-400 border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 rounded ml-2">DEMO ACC</span>}
                          </td>
                          <td className="p-4 font-mono text-neutral-500">
                            {u.email}
                          </td>
                          <td className="p-4 text-neutral-400">
                            {new Date(u.createdAt).toLocaleDateString("id-ID")}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeColor(u.role)} uppercase tracking-wider`}>
                              {getRoleLabel(u.role)}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {canManageRoles ? (
                              <div className="flex items-center justify-end gap-3">
                                <select
                                  value={u.role}
                                  onChange={(e) => handleChangeRole(u.uid, e.target.value as UserRole)}
                                  className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs bg-white font-semibold text-neutral-800 focus:outline-none"
                                >
                                  {(rolePermissions.length > 0 ? rolePermissions : [
                                    { roleId: "admin", displayName: "Super Admin" },
                                    { roleId: "manager", displayName: "Manager / Keeper" },
                                    { roleId: "viewer", displayName: "Viewer / Staff" }
                                  ]).map(role => (
                                    <option key={role.roleId} value={role.roleId}>
                                      {role.displayName}
                                    </option>
                                  ))}
                                </select>
                                
                                {u.email !== "sucipto.officiall@gmail.com" && u.uid !== "sucipto-super-admin" && !u.uid.startsWith("demo-") && (
                                  <button
                                    onClick={() => handleDeleteUser(u.uid, u.displayName)}
                                    className="p-1.5 border border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition"
                                    title="Hapus Pengguna"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-semibold text-neutral-400 italic">Hanya Admin</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: SETTINGS MANAGEMENT */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              
              {/* Card 1: System Settings Overview */}
              <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-neutral-100 text-neutral-900 rounded-2xl">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-neutral-900">Konfigurasi Sinkronisasi & Aliran Data</h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      Kendalikan frekuensi sinkronisasi inventaris dan penjualan untuk mengoptimalkan kuota pembacaan database Firestore Anda.
                    </p>
                  </div>
                </div>

                <hr className="border-neutral-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Left Column: Toggle Mode & Custom Switch */}
                  <div className="space-y-5">
                    <h5 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">Metode Sinkronisasi</h5>
                    
                    <div className="flex flex-col gap-4">
                      {/* Real-time Switch Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleRealTime(true)}
                        className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition ${
                          isRealTimeEnabled 
                            ? "bg-emerald-50/50 border-emerald-500/30 text-emerald-900" 
                            : "bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700"
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isRealTimeEnabled ? "border-emerald-500 bg-emerald-500" : "border-neutral-300"
                        }`}>
                          {isRealTimeEnabled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Sinkronisasi Real-Time (Aktif)</p>
                          <p className="text-[11px] text-neutral-400 font-light mt-0.5 leading-relaxed">
                            Secara konstan mendengarkan pembaruan database menggunakan socket Firestore <code>onSnapshot</code>. Sangat presisi, namun mengonsumsi kuota read database secara terus-menerus.
                          </p>
                        </div>
                      </button>

                      {/* Interval Polling Switch Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleRealTime(false)}
                        className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition ${
                          !isRealTimeEnabled 
                            ? "bg-amber-50/50 border-amber-500/30 text-amber-900" 
                            : "bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700"
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          !isRealTimeEnabled ? "border-amber-500 bg-amber-500" : "border-neutral-300"
                        }`}>
                          {!isRealTimeEnabled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Sinkronisasi Terjadwal / Manual (Hemat)</p>
                          <p className="text-[11px] text-neutral-400 font-light mt-0.5 leading-relaxed">
                            Memutuskan koneksi socket real-time dan mengambil data hanya pada interval pilihan Anda atau ketika Anda menekan tombol segarkan manual. Menghemat pembacaan database.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Configurable Interval Selector */}
                  <div className="space-y-5">
                    <h5 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">Interval Pembaruan Otomatis</h5>
                    
                    <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-4">
                      <p className="text-xs text-neutral-600 leading-relaxed font-light">
                        Tentukan seberapa sering aplikasi melakukan kueri ke Firestore saat berada dalam mode terjadwal:
                      </p>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 30, label: "30 Detik", desc: "Sangat Cepat" },
                          { value: 60, label: "1 Menit", desc: "Direkomendasikan" },
                          { value: 300, label: "5 Menit", desc: "Paling Hemat" }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={isRealTimeEnabled}
                            onClick={() => handleChangeInterval(opt.value)}
                            className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                              isRealTimeEnabled
                                ? "bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed"
                                : refreshInterval === opt.value
                                  ? "bg-neutral-950 border-neutral-950 text-white shadow-sm"
                                  : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300"
                            }`}
                          >
                            <span className="text-xs font-bold">{opt.label}</span>
                            <span className={`text-[9px] font-medium mt-0.5 ${
                              refreshInterval === opt.value ? "text-neutral-400" : "text-neutral-400 font-light"
                            }`}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>

                      {isRealTimeEnabled && (
                        <p className="text-[10px] text-neutral-400 italic font-mono bg-neutral-100/50 p-2.5 rounded-lg border border-dashed">
                          Info: Opsi interval dinonaktifkan karena Anda sedang menggunakan mode sinkronisasi Real-Time instan.
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 2: Live Status & Manual Action */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Status Badging */}
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">Status Sinyal Sinkronisasi</h5>
                    <p className="text-sm font-bold text-neutral-900 mt-2">Konektivitas Berjalan</p>
                  </div>

                  <div className="py-2">
                    {isRealTimeEnabled ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        REAL-TIME LISTENER AKTIF
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        BERBASIS POLLING / MANUAL
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-neutral-400 leading-relaxed font-light">
                    Koneksi ke Firestore dikendalikan oleh sistem. Semua manipulasi data lokal (seperti restok cepat) tetap diperbarui seketika.
                  </p>
                </div>

                {/* Last Update Metadata */}
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">Sinkronisasi Terakhir</h5>
                    <p className="text-3xl font-mono font-bold text-neutral-950 mt-1">
                      {lastRefreshedAt.toLocaleTimeString("id-ID")}
                    </p>
                  </div>

                  <p className="text-xs text-neutral-500 leading-normal font-light">
                    Berhasil mengambil data dari database pada pukul <span className="font-semibold text-neutral-800">{lastRefreshedAt.toLocaleTimeString("id-ID")} WIB</span>.
                  </p>

                  <p className="text-[10px] text-neutral-400 font-light font-mono">
                    Siklus Berikutnya: {isRealTimeEnabled ? "Instan (Otomatis)" : `Setiap ${refreshInterval} Detik`}
                  </p>
                </div>

                {/* Force Sync Action Button */}
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">Tindakan Paksa Sinkronisasi</h5>
                    <p className="text-xs text-neutral-400 leading-normal font-light mt-1">
                      Butuh data terbaru secara mendadak? Anda dapat memicu pengambilan data langsung dari Firestore kapan saja dengan tombol di bawah ini.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white disabled:text-neutral-400 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider transition shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Mengambil Data..." : "Segarkan Sekarang (Refresh)"}
                  </button>

                  <p className="text-[10px] text-neutral-400 text-center font-light">
                    Mengabaikan interval tunggu dan mengkueri paksa database.
                  </p>
                </div>

              </div>

              {/* Card 3: Database Reads Savings Analytics Chart (Dynamic Simulation) */}
              <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">Analisis Efisiensi & Penghematan Membaca Database</h4>
                    <p className="text-xs text-neutral-500 font-light mt-0.5">
                      Bagaimana perubahan metode ini memengaruhi penggunaan kuota gratis Firestore (Free Tier Read Quota) Anda.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  
                  {/* Left chart representation */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-neutral-500 font-light">Estimasi Query Reads per Jam (Mode Real-Time):</span>
                        <span className="text-red-600 font-mono">~1,800 reads</span>
                      </div>
                      <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-neutral-500 font-light">
                          Estimasi Query Reads per Jam (Mode {isRealTimeEnabled ? "Hemat Terjadwal 1m" : `Interval ${refreshInterval}s`}):
                        </span>
                        <span className="text-emerald-600 font-mono">
                          ~{isRealTimeEnabled ? 60 : Math.round(3600 / refreshInterval)} reads
                        </span>
                      </div>
                      <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${isRealTimeEnabled ? 5 : Math.max(2, Math.round((3600 / refreshInterval) / 1800 * 100))}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right big stats block */}
                  <div className="p-6 bg-emerald-50/20 border border-emerald-100 rounded-2xl flex flex-col justify-center items-center text-center space-y-2">
                    <p className="text-xs font-bold text-emerald-800 tracking-wider uppercase">Efisiensi Tercapai</p>
                    <p className="text-4xl font-serif font-black text-emerald-700">
                      {isRealTimeEnabled 
                        ? "96.7%" 
                        : `${(100 - ( (3600 / refreshInterval) / 1800 * 100 )).toFixed(1)}%`
                      }
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      Mengurangi pembacaan database yang tidak perlu ketika dasbor sedang idle atau minim aktivitas perubahan stok.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 8: SUPPLIERS */}
          {activeTab === "suppliers" && (
            <div className="space-y-8 animate-fade-in">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Total Supplier Terdaftar</p>
                    <p className="text-2xl font-bold text-neutral-950 mt-1.5">{suppliers.length} Supplier</p>
                    <p className="text-[10px] text-neutral-500 font-medium mt-1">Mitra Rantai Pasok Selasar</p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-800 shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Produk Terhubung</p>
                    <p className="text-2xl font-bold text-neutral-950 mt-1.5">
                      {products.filter(p => p.supplierId).length} Item
                    </p>
                    <p className="text-[10px] text-neutral-500 font-medium mt-1">Telah dipetakan ke Pemasok</p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-800 shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Perlu Reorder Segera</p>
                    <p className={`text-2xl font-bold mt-1.5 ${
                      products.filter(p => p.supplierId && p.stock <= p.lowStockThreshold).length > 0
                        ? "text-red-600 animate-pulse"
                        : "text-neutral-950"
                    }`}>
                      {products.filter(p => p.supplierId && p.stock <= p.lowStockThreshold).length} Item
                    </p>
                    <p className="text-[10px] text-neutral-500 font-medium mt-1">Stok di bawah ambang batas</p>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Main Supplier content splits */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Panel: Supplier List */}
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden lg:col-span-5 flex flex-col">
                  <div className="p-6 border-b border-neutral-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-neutral-950">Daftar Supplier</h3>
                        <p className="text-xs text-neutral-400">Kelola rincian kontak & reorder otomatis</p>
                      </div>
                      {canEditSuppliers && (
                        <button
                          onClick={() => {
                            setEditingSupplier(null);
                            setSupplierForm({
                              name: "",
                              contactName: "",
                              email: "",
                              phone: "",
                              address: ""
                            });
                            setIsSupplierModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tambah
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-100 max-h-[60vh] overflow-y-auto">
                    {suppliers.length === 0 ? (
                      <div className="p-12 text-center text-neutral-400 space-y-2">
                        <Truck className="w-10 h-10 text-neutral-300 mx-auto" />
                        <p className="text-xs font-medium">Belum ada supplier terdaftar.</p>
                        <p className="text-[10px] font-light text-neutral-400">Silakan tambahkan supplier baru untuk memulai menghubungkan produk.</p>
                      </div>
                    ) : (
                      suppliers.map(s => {
                        const linkedCount = products.filter(p => p.supplierId === s.id).length;
                        const lowStockCount = products.filter(p => p.supplierId === s.id && p.stock <= p.lowStockThreshold).length;
                        const isSelected = selectedSupplierId === s.id;

                        return (
                          <div 
                            key={s.id}
                            onClick={() => setSelectedSupplierId(s.id)}
                            className={`p-5 transition flex flex-col gap-2 cursor-pointer ${
                              isSelected 
                                ? "bg-neutral-50/70 border-l-4 border-neutral-900" 
                                : "hover:bg-neutral-50/40"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-900">{s.name}</h4>
                                <p className="text-xs text-neutral-500 font-medium">{s.contactName || "Tanpa Nama Kontak"}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {lowStockCount > 0 && (
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 rounded-full animate-pulse">
                                    {lowStockCount} LOW
                                  </span>
                                )}
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200 rounded-full">
                                  {linkedCount} Produk
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-400 font-mono mt-1">
                              {s.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-neutral-400" />
                                  {s.phone}
                                </span>
                              )}
                              {s.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-neutral-400" />
                                  {s.email}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Panel: Supplier Details & Reorder Hub */}
                <div className="lg:col-span-7 space-y-8">
                  {selectedSupplierId ? (
                    (() => {
                      const sup = suppliers.find(s => s.id === selectedSupplierId);
                      if (!sup) return null;

                      const linkedProds = products.filter(p => p.supplierId === sup.id);
                      const lowStockProds = linkedProds.filter(p => p.stock <= p.lowStockThreshold);

                      // WhatsApp & email message template builder
                      const generateMessageText = () => {
                        let text = `Halo Ibu/Bapak ${sup.contactName || sup.name},\n\nKami dari *Topota.id Foods* ingin memesan kembali (reorder) produk berikut karena stok kami sudah menipis:\n\n`;
                        lowStockProds.forEach((p, idx) => {
                          const suggestedQty = Math.max(20, (p.lowStockThreshold * 3) - p.stock);
                          text += `${idx + 1}. *${p.name}* (SKU: ${p.id})\n   - Sisa Stok Saat Ini: *${p.stock} unit*\n   - Rekomendasi Jumlah Reorder: *${suggestedQty} unit*\n\n`;
                        });
                        text += `Mohon bantuannya untuk mengonfirmasi ketersediaan barang-barang tersebut dan menginformasikan total biaya beserta ongkos kirim ke alamat kami.\n\nTerima kasih banyak!`;
                        return text;
                      };

                      const handleCopyTemplate = () => {
                        const templateText = generateMessageText();
                        navigator.clipboard.writeText(templateText);
                        alert("Template pesanan berhasil disalin ke clipboard!");
                      };

                      const getWhatsAppUrl = () => {
                        const cleanPhone = sup.phone.replace(/[^0-9+]/g, "").replace(/^0/, "62");
                        return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(generateMessageText())}`;
                      };

                      const getMailToUrl = () => {
                        const subject = `Reorder Produk - Topota.id Foods`;
                        return `mailto:${sup.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(generateMessageText())}`;
                      };

                      return (
                        <div className="space-y-8 animate-fade-in">
                          
                          {/* Details Card */}
                          <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-neutral-100 pb-6">
                              <div>
                                <h3 className="font-serif text-xl font-bold text-neutral-950">{sup.name}</h3>
                                <p className="text-xs text-neutral-400 font-mono mt-1">ID Supplier: {sup.id}</p>
                              </div>

                              {canEditSuppliers && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEditSupplier(sup)}
                                    className="p-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                                    title="Edit Informasi Supplier"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSupplier(sup.id)}
                                    className="p-2 border border-red-100 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                                    title="Hapus Supplier"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nama Kontak Utama</span>
                                <span className="text-xs font-semibold text-neutral-800">{sup.contactName || "-"}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nomor Telepon / WhatsApp</span>
                                <span className="text-xs font-semibold text-neutral-800 font-mono flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                                  {sup.phone || "-"}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Alamat Surel (Email)</span>
                                <span className="text-xs font-semibold text-neutral-800 font-mono flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                                  {sup.email || "-"}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Alamat Supplier</span>
                                <span className="text-xs font-semibold text-neutral-800 flex items-start gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                                  {sup.address || "-"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Linked Products List */}
                          <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
                            <div>
                              <h4 className="font-serif text-lg font-bold text-neutral-950">Produk Terhubung</h4>
                              <p className="text-xs text-neutral-400">Daftar produk yang disuplai oleh {sup.name}</p>
                            </div>

                            {linkedProds.length === 0 ? (
                              <div className="p-8 text-center text-neutral-400 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
                                <p className="text-xs font-medium">Belum ada produk yang dihubungkan ke supplier ini.</p>
                                <p className="text-[10px] font-light mt-1 text-neutral-400">
                                  Untuk menghubungkan produk, edit produk dari tab *Kelola Inventaris* dan pilih supplier ini.
                                </p>
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b border-neutral-200 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                                      <th className="py-3">Produk</th>
                                      <th className="py-3">Stok</th>
                                      <th className="py-3">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-neutral-100 text-xs">
                                    {linkedProds.map(p => {
                                      const isLow = p.stock <= p.lowStockThreshold;
                                      return (
                                        <tr key={p.id} className="hover:bg-neutral-50/20">
                                          <td className="py-3 flex items-center gap-3">
                                            <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                                            <div>
                                              <span className="font-semibold text-neutral-800 block">{p.name}</span>
                                              <span className="text-[10px] text-neutral-400 font-mono">SKU: {p.id}</span>
                                            </div>
                                          </td>
                                          <td className="py-3 font-mono font-medium">{p.stock} unit</td>
                                          <td className="py-3">
                                            {isLow ? (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 animate-pulse">
                                                <AlertTriangle className="w-3 h-3" /> Perlu Reorder
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                <CheckCircle className="w-3 h-3" /> Stok Aman
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          {/* Reordering Hub */}
                          <div className="bg-neutral-900 text-white p-8 rounded-3xl border border-neutral-800 shadow-xl space-y-6">
                            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                              <div className="p-2.5 bg-white/5 text-white border border-white/5 rounded-xl">
                                <Truck className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-serif text-lg font-bold">Pusat Pemesanan Ulang Cepat (Quick Reorder)</h4>
                                <p className="text-xs text-neutral-400">Kirim daftar pesanan ke supplier via WhatsApp, email atau salin draf langsung</p>
                              </div>
                            </div>

                            {lowStockProds.length === 0 ? (
                              <div className="p-6 bg-emerald-950/25 border border-emerald-800/40 rounded-2xl flex flex-col items-center text-center space-y-2">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                                <p className="text-xs font-semibold text-emerald-300">Persediaan Produk Terkendali!</p>
                                <p className="text-[10px] text-emerald-400 font-light">
                                  Seluruh produk dari supplier ini memiliki stok yang memadai di atas batas minimum. Tidak ada pemesanan ulang yang mendesak saat ini.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <div className="p-4.5 bg-white/5 border border-white/5 rounded-2xl">
                                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Pratinjau Draf Pesanan</p>
                                  <pre className="text-[11px] font-mono text-neutral-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed bg-neutral-950/40 p-3 rounded-lg border border-white/5">
                                    {generateMessageText()}
                                  </pre>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <a
                                    href={getWhatsAppUrl()}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm text-center"
                                  >
                                    <Phone className="w-4 h-4" />
                                    Kirim WhatsApp
                                  </a>
                                  <a
                                    href={getMailToUrl()}
                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm text-center"
                                  >
                                    <Mail className="w-4 h-4" />
                                    Kirim Email
                                  </a>
                                  <button
                                    onClick={handleCopyTemplate}
                                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 py-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                                  >
                                    Salin Draf Pesanan
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })()
                  ) : (
                    <div className="bg-white p-12 rounded-3xl border border-neutral-200 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[400px] space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-400 flex items-center justify-center shrink-0">
                        <Truck className="w-7 h-7" />
                      </div>
                      <h4 className="font-serif text-lg font-bold text-neutral-950">Hub Detail Supplier</h4>
                      <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                        Pilih supplier dari daftar di samping kiri untuk memeriksa informasi kontak lengkap, melihat katalog produk yang disuplai, dan melakukan order re-stock cepat.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* PRODUCT CRUD MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h3 className="font-serif text-lg font-bold text-neutral-950">
                {editingProduct ? "Ubah Produk Inventaris" : "Tambah Produk Baru"}
              </h3>
              <button 
                onClick={() => {
                  setIsProductModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Scrollable */}
            <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Nama Produk</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Nasi Goreng Spesial"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Kategori</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none focus:border-neutral-900"
                  >
                    <option value="Makanan Utama">Makanan Utama</option>
                    <option value="Camilan">Camilan</option>
                    <option value="Minuman">Minuman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Harga Satuan (IDR)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    placeholder="3450000"
                    value={productForm.price || ""}
                    onChange={(e) => setProductForm({ ...productForm, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Jumlah Stok Awal</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    placeholder="12"
                    value={productForm.stock || ""}
                    onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Ambang Stok Rendah</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    placeholder="5"
                    value={productForm.lowStockThreshold || ""}
                    onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">URL Foto Produk (Dari Internet)</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..."
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Pemasok / Supplier</label>
                  <select 
                    value={productForm.supplierId}
                    onChange={(e) => setProductForm({ ...productForm, supplierId: e.target.value })}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none focus:border-neutral-900"
                  >
                    <option value="">-- Tanpa Hubungan Supplier (Umum) --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.contactName || "Tanpa Kontak"})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Status Produk</label>
                  <select 
                    value={productForm.status || "Aktif"}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value as "Aktif" | "Nonaktif" })}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none focus:border-neutral-900"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Hubungkan produk ini ke supplier tertentu untuk mempermudah proses pemesanan ulang (reorder) dari tab Supplier.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Deskripsi Produk Lengkap</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Ceritakan rasa, bahan utama, porsi, keunikan bumbu, kebersihan, dll..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-5 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition shadow-sm"
                >
                  Simpan Produk
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* SUPPLIER ADD/EDIT MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-neutral-950">
                  {editingSupplier ? "Edit Data Supplier" : "Tambah Supplier Baru"}
                </h3>
                <p className="text-xs text-neutral-400">Rincian mitra pemasok rantai pasokan Selasar</p>
              </div>
              <button 
                onClick={() => {
                  setIsSupplierModalOpen(false);
                  setEditingSupplier(null);
                }}
                className="p-1 rounded-full hover:bg-neutral-50 text-neutral-400 hover:text-neutral-600 transition shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSupplierSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Nama Perusahaan / Supplier</label>
                <input 
                  type="text" 
                  required
                  placeholder="PT. Sinar Semesta"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Nama Kontak Utama (PIC)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ibu Amalia Sari"
                  value={supplierForm.contactName}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Nomor Telepon / WA</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="08123456789"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="kontak@pemasok.com"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Alamat Lengkap</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Jl. Industri Kimia No. 45, Kawasan Industri Jababeka, Bekasi"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSupplierModalOpen(false);
                    setEditingSupplier(null);
                  }}
                  className="px-5 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition shadow-sm"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-neutral-950">
                  Tambah Pengguna Baru
                </h3>
                <p className="text-xs text-neutral-400">Tambahkan Manager atau Staff/Viewer ke sistem topota.id</p>
              </div>
              <button 
                onClick={() => {
                  setIsAddUserModalOpen(false);
                  setAddUserForm({ displayName: "", email: "", role: "viewer" });
                  setAddUserError("");
                }}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
              {addUserError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold leading-relaxed border border-red-100 animate-fade-in">
                  {addUserError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={addUserForm.displayName}
                  onChange={(e) => setAddUserForm({ ...addUserForm, displayName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Alamat Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="Contoh: budi@topota.id"
                  value={addUserForm.email}
                  onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 font-mono"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Pengguna akan dapat langsung login menggunakan alamat email ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Peran / Hak Akses (Role)</label>
                <select 
                  value={addUserForm.role}
                  onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none focus:border-neutral-900 font-semibold text-neutral-800"
                >
                  {(rolePermissions.length > 0 ? rolePermissions : [
                    { roleId: "admin", displayName: "Super Admin" },
                    { roleId: "manager", displayName: "Manager / Keeper" },
                    { roleId: "viewer", displayName: "Viewer / Staff" }
                  ]).map(role => (
                    <option key={role.roleId} value={role.roleId}>
                      {role.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUserModalOpen(false);
                    setAddUserForm({ displayName: "", email: "", role: "viewer" });
                    setAddUserError("");
                  }}
                  className="px-5 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition shadow-sm disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  {addUserLoading ? "Memproses..." : "Tambah Pengguna"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ADD CUSTOM ROLE MODAL */}
      {isNewRoleModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-neutral-950">
                  Tambah Peran Kustom Baru
                </h3>
                <p className="text-xs text-neutral-400">Definisikan peran baru untuk memisahkan tingkat hak akses staff.</p>
              </div>
              <button 
                onClick={() => {
                  setIsNewRoleModalOpen(false);
                  setNewRoleForm({
                    roleId: "",
                    displayName: "",
                    editProducts: false,
                    editLanding: false,
                    editSuppliers: false,
                    manageBackups: false,
                    manageRoles: false,
                    viewTransactions: true
                  });
                  setNewRoleError("");
                }}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddCustomRole} className="p-6 space-y-4 overflow-y-auto">
              {newRoleError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold leading-relaxed border border-red-100 animate-fade-in">
                  {newRoleError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">ID Peran (Unique Key)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: supervisor, sales_clerk"
                  value={newRoleForm.roleId}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, roleId: e.target.value })}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900 font-mono"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  ID Peran harus unik, hanya huruf kecil, angka, garis bawah, atau strip.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Nama Tampilan Peran (Display Name)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Supervisor Toko, Kasir Utama"
                  value={newRoleForm.displayName}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, displayName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="space-y-2 border-t border-neutral-100 pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-600">Izin Bawaan</p>
                
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
                  <input
                    type="checkbox"
                    checked={newRoleForm.editProducts}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, editProducts: e.target.checked })}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span>Bisa Kelola & Edit Produk</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
                  <input
                    type="checkbox"
                    checked={newRoleForm.editSuppliers}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, editSuppliers: e.target.checked })}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span>Bisa Kelola Supplier Mitra</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
                  <input
                    type="checkbox"
                    checked={newRoleForm.editLanding}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, editLanding: e.target.checked })}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span>Bisa Ubah Tampilan Landing Page</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
                  <input
                    type="checkbox"
                    checked={newRoleForm.manageBackups}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, manageBackups: e.target.checked })}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span>Bisa Backup & Restore Data</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
                  <input
                    type="checkbox"
                    checked={newRoleForm.manageRoles}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, manageRoles: e.target.checked })}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span>Bisa Kelola Hak Akses & Peran User</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
                  <input
                    type="checkbox"
                    checked={newRoleForm.viewTransactions}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, viewTransactions: e.target.checked })}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span>Bisa Lihat Transaksi & Finansial</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewRoleModalOpen(false);
                    setNewRoleForm({
                      roleId: "",
                      displayName: "",
                      editProducts: false,
                      editLanding: false,
                      editSuppliers: false,
                      manageBackups: false,
                      manageRoles: false,
                      viewTransactions: true
                    });
                    setNewRoleError("");
                  }}
                  className="px-5 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-600 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition shadow-sm"
                >
                  Buat Peran
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* BULK CSV IMPORT MODAL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-neutral-950">
                  Impor & Pembaruan Massal via CSV
                </h3>
                <p className="text-xs text-neutral-400">Pembaruan cepat tingkat stok atau info detail produk secara instan</p>
              </div>
              <button 
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setCsvParsedData([]);
                  setCsvError("");
                  setCsvSuccessCount(null);
                }}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Info & Template Download */}
              <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4 space-y-3">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Format & Kolom Berkas (.csv)</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Gunakan berkas berformat <strong>CSV (Comma Separated)</strong> dengan baris tajuk (headers) berikut. Sistem kami secara pintar mencocokkan kolom baik dalam bahasa Indonesia maupun Inggris:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-neutral-600 bg-white p-3 rounded-xl border border-neutral-150">
                  <div><strong>id</strong>: ID produk (opsional)</div>
                  <div><strong>name / nama</strong>: Nama menu</div>
                  <div><strong>category / kategori</strong>: Jenis menu</div>
                  <div><strong>price / harga</strong>: IDR (angka)</div>
                  <div><strong>stock / stok</strong>: Jumlah unit</div>
                  <div><strong>lowStockThreshold / ambang_batas</strong>: (opsional)</div>
                  <div><strong>description / deskripsi</strong>: Info menu</div>
                  <div><strong>imageUrl / gambar</strong>: URL foto</div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    * Kosongkan kolom ID untuk menambahkan menu baru. Isi ID untuk update menu yang sudah ada.
                  </span>
                  <button
                    type="button"
                    onClick={downloadCsvTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition animate-fade-in"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Templat CSV
                  </button>
                </div>
              </div>

              {/* Upload Zone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600">Pilih Berkas CSV Anda</label>
                <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 hover:bg-neutral-50/50 transition flex flex-col items-center justify-center text-center space-y-3 relative">
                  <Upload className="w-8 h-8 text-neutral-400" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-neutral-700">Tarik dan seret file CSV di sini, atau klik untuk memilih file</p>
                    <p className="text-[10px] text-neutral-400">Pastikan encoding berkas adalah UTF-8 dan format pemisah koma (,)</p>
                  </div>
                  <input
                    id="csv_file_uploader"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {csvError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                  {csvError}
                </div>
              )}

              {csvSuccessCount !== null && (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <p className="font-bold">Berhasil Diimpor!</p>
                  <p>Sebanyak <strong>{csvSuccessCount} produk</strong> telah berhasil diproses (ditambahkan atau diperbarui) ke database Firestore secara real-time.</p>
                </div>
              )}

              {/* Parsed Data Preview Table */}
              {csvParsedData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest">Pratinjau Data ({csvParsedData.length} item ditemukan)</h4>
                    <span className="text-[10px] text-neutral-400">Periksa detail di bawah ini sebelum menyimpan perubahan</span>
                  </div>

                  <div className="overflow-x-auto border border-neutral-200 rounded-xl max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-neutral-50 text-neutral-500 font-bold uppercase border-b border-neutral-200">
                        <tr>
                          <th className="p-2.5 pl-4">Aksi</th>
                          <th className="p-2.5">Nama Produk</th>
                          <th className="p-2.5">Kategori</th>
                          <th className="p-2.5">Harga</th>
                          <th className="p-2.5">Stok</th>
                          <th className="p-2.5 pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-600 bg-white">
                        {csvParsedData.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? "hover:bg-neutral-50/50" : "bg-red-50/30"}>
                            <td className="p-2.5 pl-4 font-bold">
                              {row.action === "update" ? (
                                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] uppercase font-mono border border-indigo-150">Update</span>
                              ) : (
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase font-mono border border-emerald-150">Create</span>
                              )}
                            </td>
                            <td className="p-2.5 font-semibold text-neutral-800">{row.name || <span className="text-red-400 italic">[Kosong]</span>}</td>
                            <td className="p-2.5 text-neutral-500">{row.category}</td>
                            <td className="p-2.5 font-mono">{formatRupiah(row.price)}</td>
                            <td className="p-2.5 font-mono font-semibold">{row.stock} unit</td>
                            <td className="p-2.5 pr-4">
                              {row.isValid ? (
                                <span className="text-emerald-700 font-bold">✓ Valid</span>
                              ) : (
                                <span className="text-red-600 font-bold">✗ Tidak Valid (Nama kosong atau harga/stok negatif)</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-neutral-100 flex justify-end gap-3 bg-neutral-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setCsvParsedData([]);
                  setCsvError("");
                  setCsvSuccessCount(null);
                }}
                className="px-5 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-600 transition"
              >
                Tutup
              </button>
              {csvParsedData.length > 0 && (
                <button
                  type="button"
                  disabled={isCsvApplying || csvParsedData.filter(r => r.isValid).length === 0}
                  onClick={applyBulkCsvUpdate}
                  className="flex items-center gap-1.5 px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition shadow-sm disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
                >
                  {isCsvApplying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menerapkan...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Terapkan Pembaruan Massal ({csvParsedData.filter(r => r.isValid).length})
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SELECTED PRODUCT QR & BARCODE IDENTIFICATION CARD MODAL */}
      {selectedScanProduct && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-neutral-900 text-white rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-neutral-950">
                    Kartu Identifikasi & Label Barang
                  </h3>
                  <p className="text-xs text-neutral-400">Pratinjau QR, Barcode, cetak label, dan Stock Opname instan</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedScanProduct(null)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-8">
              
              {/* Left Column: QR & Barcode Visual Cards */}
              <div className="space-y-6 flex flex-col justify-center">
                {/* QR Code Container */}
                <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 flex flex-col items-center justify-center space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">QR Code SKU</span>
                  <div className="bg-white p-3 rounded-xl border border-neutral-150 shadow-sm flex items-center justify-center">
                    {generatedQrCodeUrl ? (
                      <img 
                        src={generatedQrCodeUrl} 
                        alt="QR Code SKU" 
                        className="w-36 h-36 object-contain"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center text-xs text-neutral-400 italic">
                        Membuat QR Code...
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-neutral-500 bg-white border border-neutral-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                    {selectedScanProduct.id}
                  </span>
                </div>

                {/* Barcode Code 39 Container */}
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 flex flex-col items-center justify-center space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Barcode (Code 39)</span>
                  <div className="bg-white px-4 py-5 rounded-xl border border-neutral-150 shadow-sm w-full h-20 flex items-center justify-center">
                    <div 
                      className="w-full h-full max-w-xs"
                      dangerouslySetInnerHTML={{ __html: generateCode39Svg(selectedScanProduct.id) }} 
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-900">
                    *{selectedScanProduct.id.toUpperCase()}*
                  </span>
                </div>
              </div>

              {/* Right Column: Product Detail & Physical Audit Stock Take */}
              <div className="space-y-6">
                
                {/* Product Detail Card */}
                <div className="flex items-start gap-4 p-4 bg-neutral-50 border border-neutral-155 rounded-2xl">
                  <img 
                    src={selectedScanProduct.imageUrl} 
                    alt={selectedScanProduct.name} 
                    className="w-16 h-16 object-cover rounded-xl border border-neutral-200 bg-white shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <span className="px-2 py-0.5 bg-neutral-200 text-neutral-700 text-[9px] font-bold uppercase rounded-md">
                      {selectedScanProduct.category}
                    </span>
                    <h4 className="font-bold text-neutral-900 truncate text-sm">{selectedScanProduct.name}</h4>
                    <p className="text-xs text-neutral-500 font-semibold">{formatRupiah(selectedScanProduct.price)}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">ID: {selectedScanProduct.id}</p>
                  </div>
                </div>

                {/* Stock Audit Adjust Form */}
                <form onSubmit={handleSingleProductStockAdjust} className="bg-neutral-50/50 p-5 rounded-2xl border border-neutral-200 space-y-4 shadow-2xs">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Pemeriksaan & Stock Opname</h4>
                    <p className="text-[10px] text-neutral-400">Verifikasi fisik barang di gudang / toko saat ini.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-neutral-150 text-center">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase block">Stok Sistem (DB)</span>
                      <span className="text-xl font-mono font-black text-neutral-800">{selectedScanProduct.stock}</span>
                      <span className="text-[9px] text-neutral-400 block mt-0.5">unit terdaftar</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-neutral-150 flex flex-col justify-center">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase text-center block mb-1">Jumlah Fisik Rak</label>
                      <input 
                        type="number"
                        required
                        min="0"
                        value={physicalCountInput}
                        onChange={(e) => setPhysicalCountInput(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                        className="w-full text-center font-mono font-black text-lg text-neutral-900 border border-neutral-200 rounded-lg py-0.5 focus:outline-none focus:border-neutral-900 bg-white"
                      />
                    </div>
                  </div>

                  {/* Discrepancy Calculation Preview */}
                  {physicalCountInput !== "" && (
                    <div className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                      Number(physicalCountInput) - selectedScanProduct.stock === 0
                        ? "bg-neutral-50 border-neutral-200 text-neutral-600"
                        : Number(physicalCountInput) - selectedScanProduct.stock > 0
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                          : "bg-red-50 border-red-200 text-red-800 font-semibold"
                    }`}>
                      <span>Selisih Hasil Opname:</span>
                      <span className="font-mono">
                        {Number(physicalCountInput) - selectedScanProduct.stock === 0 
                          ? "Sesuai (0 Selisih)" 
                          : Number(physicalCountInput) - selectedScanProduct.stock > 0
                            ? `Surplus / Kelebihan +${Number(physicalCountInput) - selectedScanProduct.stock} unit`
                            : `Loss / Kehilangan ${Number(physicalCountInput) - selectedScanProduct.stock} unit`
                        }
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!canEditProducts || physicalCountInput === ""}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
                      canEditProducts 
                        ? "bg-neutral-950 hover:bg-neutral-800 text-white shadow-xs cursor-pointer" 
                        : "bg-neutral-100 text-neutral-400 border border-neutral-250 cursor-not-allowed"
                    }`}
                  >
                    Simpan & Perbarui Stok Fisik
                  </button>
                </form>

              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-neutral-100 flex justify-between bg-neutral-50/50">
              <button
                type="button"
                onClick={() => downloadProductLabelPDF(selectedScanProduct)}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak & Unduh Label PDF
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedScanProduct(null)}
                className="px-5 py-2 border border-neutral-250 hover:bg-neutral-100 rounded-xl text-xs font-semibold text-neutral-600 transition bg-white cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* HIGH-TECH WAREHOUSE STOCK OPNAME SCANNER TERMINAL */}
      {isOpnameTerminalOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
            
            {/* Dark Tech Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-neutral-950 rounded-xl animate-pulse">
                  <Barcode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                      Terminal Stock Opname v2.1
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      SCANNER LIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono">Gunakan scanner fisik atau ketik kode SKU/ID produk untuk merekam stok</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsOpnameTerminalOpen(false);
                  setTerminalScannedProduct(null);
                  setTerminalSearchInput("");
                  setTerminalPhysicalCount("");
                }}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Terminal Grid */}
            <div className="flex-1 overflow-hidden grid md:grid-cols-12">
              
              {/* Left Panel: Scanner Feed & Edit (7 columns) */}
              <div className="md:col-span-7 p-6 flex flex-col justify-between space-y-6 overflow-y-auto border-r border-neutral-800 bg-neutral-900">
                
                {/* Search / Scan Trigger Bar */}
                <form onSubmit={handleTerminalBarcodeScan} className="space-y-2">
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">INPUT KODE SKU / NAMA BARANG</label>
                  <div className="relative">
                    <input 
                      id="terminal_scan_input"
                      type="text"
                      placeholder="Pindai barcode / Masukkan SKU / Nama lalu tekan Enter..."
                      value={terminalSearchInput}
                      onChange={(e) => setTerminalSearchInput(e.target.value)}
                      className="w-full bg-neutral-950 text-white font-mono font-bold text-xs border border-neutral-800 rounded-xl pl-4 pr-24 py-3 focus:outline-none focus:border-amber-500 tracking-wider text-amber-400"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition cursor-pointer"
                    >
                      Pindai
                    </button>
                  </div>
                </form>

                {/* Laser scan effect container / visual display */}
                <div className="flex-1 min-h-[220px] border border-neutral-800 rounded-2xl bg-neutral-950 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center space-y-4">
                  
                  {/* Holographic Laser scanner line animation */}
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse z-10"></div>
                  
                  {terminalScannedProduct ? (
                    // Display details of currently scanned product
                    <div className="w-full space-y-4 animate-fade-in z-20">
                      <div className="flex items-center justify-center gap-4">
                        <img 
                          src={terminalScannedProduct.imageUrl} 
                          alt={terminalScannedProduct.name} 
                          className="w-16 h-16 object-cover rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg"
                        />
                        <div className="text-left space-y-1">
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono rounded">
                            {terminalScannedProduct.category}
                          </span>
                          <h4 className="font-bold text-white text-sm tracking-wide">{terminalScannedProduct.name}</h4>
                          <p className="font-mono text-xs text-neutral-400">SKU: {terminalScannedProduct.id}</p>
                          <p className="font-mono text-xs text-emerald-400 font-bold">{formatRupiah(terminalScannedProduct.price)}</p>
                        </div>
                      </div>

                      {/* Adjust form inside the screen */}
                      <form onSubmit={handleTerminalStockSave} className="max-w-xs mx-auto space-y-3 bg-neutral-905 p-4 rounded-xl border border-neutral-800">
                        <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                          <span>Stok di Sistem:</span>
                          <span className="text-white font-bold">{terminalScannedProduct.stock} unit</span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-4">
                          <label htmlFor="terminal_qty_input" className="text-[11px] font-mono font-bold text-neutral-300">STOK FISIK RAK:</label>
                          <input 
                            id="terminal_qty_input"
                            type="number"
                            required
                            min="0"
                            value={terminalPhysicalCount}
                            onChange={(e) => setTerminalPhysicalCount(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                            className="w-24 bg-neutral-950 text-white border border-neutral-800 focus:border-amber-500 font-mono font-black text-center text-sm py-1 rounded-lg"
                          />
                        </div>

                        {terminalPhysicalCount !== "" && (
                          <div className="text-[10px] font-mono flex justify-between border-t border-neutral-800 pt-2 text-neutral-400">
                            <span>Selisih:</span>
                            <span className={Number(terminalPhysicalCount) - terminalScannedProduct.stock === 0 ? "text-neutral-400" : Number(terminalPhysicalCount) - terminalScannedProduct.stock > 0 ? "text-emerald-400" : "text-red-400"}>
                              {Number(terminalPhysicalCount) - terminalScannedProduct.stock === 0 ? "Sesuai (0)" : Number(terminalPhysicalCount) - terminalScannedProduct.stock > 0 ? `Surplus +${Number(terminalPhysicalCount) - terminalScannedProduct.stock}` : `Loss ${Number(terminalPhysicalCount) - terminalScannedProduct.stock}`}
                            </span>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          Simpan & Refresh (Enter)
                        </button>
                      </form>
                    </div>
                  ) : (
                    // Idle visual scanning cue
                    <div className="space-y-2 text-neutral-500 z-20">
                      <Barcode className="w-12 h-12 text-neutral-700 mx-auto animate-pulse" />
                      <p className="font-mono text-[11px] tracking-wider uppercase text-neutral-400">MENGUNGGULKAN SCAN TARGET...</p>
                      <p className="text-[10px] text-neutral-500">Posisikan barcode stiker di depan scanner atau ketik SKU di atas.</p>
                    </div>
                  )}

                  {/* Feedback overlay messages inside visual screen */}
                  {terminalScanError && (
                    <div className="absolute inset-x-0 bottom-4 mx-4 p-2 bg-red-900/30 border border-red-500/30 text-red-400 rounded-lg text-[11px] font-mono animate-pulse z-30">
                      ⚠ {terminalScanError}
                    </div>
                  )}

                  {terminalSuccessMsg && (
                    <div className="absolute inset-x-0 bottom-4 mx-4 p-2 bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-[11px] font-mono z-30">
                      ✓ {terminalSuccessMsg}
                    </div>
                  )}
                </div>

                {/* Hotkeys indicator */}
                <div className="flex justify-between font-mono text-[9px] text-neutral-500 border-t border-neutral-800 pt-3">
                  <span>HINT: Tekan [ Enter ] untuk mencari SKU / Simpan jumlah unit.</span>
                  <span>SESSION STREAK: {opnameSessionLogs.length} Scans</span>
                </div>

              </div>

              {/* Right Panel: Audit Session History logs list (5 columns) */}
              <div className="md:col-span-5 p-5 flex flex-col h-full bg-neutral-950 text-neutral-300">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                  <span className="font-mono text-[11px] font-bold text-neutral-400 tracking-wider">RIWAYAT SCAN OPNAME SESI INI</span>
                  <button
                    onClick={() => {
                      if (window.confirm("Bersihkan seluruh log pencatatan sesi ini?")) {
                        setOpnameSessionLogs([]);
                      }
                    }}
                    className="text-[9px] font-mono text-neutral-500 hover:text-red-400 flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Sesi
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh] md:max-h-[none]">
                  {opnameSessionLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600 py-12 space-y-2 font-mono">
                      <Database className="w-8 h-8 text-neutral-800" />
                      <p className="text-[10px]">Belum ada pencatatan stok opname.</p>
                      <p className="text-[9px]">Setiap stok yang Anda simpan di scanner akan tercatat di log audit lokal ini.</p>
                    </div>
                  ) : (
                    opnameSessionLogs.map((log, idx) => (
                      <div key={idx} className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl flex flex-col space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-white font-bold truncate block max-w-[150px]">{log.productName}</span>
                          <span className="text-[9px] text-neutral-500 shrink-0">{log.timestamp}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-neutral-400 border-t border-neutral-800 pt-1.5">
                          <span>Stok: {log.prevStock} → <strong className="text-white">{log.countedStock}</strong></span>
                          <span className={log.discrepancy === 0 ? "text-neutral-400" : log.discrepancy > 0 ? "text-emerald-400" : "text-red-400"}>
                            {log.discrepancy === 0 ? "Sesuai" : log.discrepancy > 0 ? `+${log.discrepancy} (Surplus)` : `${log.discrepancy} (Loss)`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-neutral-800 pt-4 mt-4 bg-neutral-950">
                  <button
                    onClick={() => {
                      setIsOpnameTerminalOpen(false);
                      setTerminalScannedProduct(null);
                      setTerminalSearchInput("");
                    }}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs font-bold py-2.5 rounded-xl border border-neutral-800 transition text-center uppercase tracking-wider cursor-pointer"
                  >
                    Tutup Terminal Opname
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      <OnboardingTour activeTab={activeTab} setActiveTab={(tab) => setActiveTab(tab as any)} theme={theme} />
    </div>
  );
}
