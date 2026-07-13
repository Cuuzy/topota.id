export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  imageUrl: string;
  category: string;
  soldCount: number;
  createdAt: string;
  updatedAt: string;
  supplierId?: string;
  status?: 'Aktif' | 'Nonaktif';
}

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  priceAtSale: number;
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'success' | 'failed';
  date: string; // ISO string
}

export interface LandingFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface LandingContent {
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  aboutText: string;
  aboutImageUrl: string;
  ctaText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  features: LandingFeature[];
}

export type UserRole = 'admin' | 'manager' | 'viewer' | string;

export interface RolePermissionConfig {
  roleId: string;
  displayName: string;
  editProducts: boolean;
  editLanding: boolean;
  editSuppliers: boolean;
  manageBackups: boolean;
  manageRoles: boolean;
  viewTransactions: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface InventoryBackup {
  id: string;
  createdAt: string;
  createdBy: string;
  itemCount: number;
  products: Product[];
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  category: 'Keuangan' | 'Inventaris' | 'Transaksi' | 'Rantai Pasok';
  description: string;
  size: 'small' | 'medium';
}

export interface CustomerFeedback {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'Baru' | 'Dihubungi' | 'Selesai';
  createdAt: string;
  notes?: string;
}


