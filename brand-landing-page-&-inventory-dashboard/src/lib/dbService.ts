import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  runTransaction 
} from "firebase/firestore";
import { db } from "../firebase";
import { Product, Transaction, LandingContent, UserProfile, UserRole, InventoryBackup, Supplier, RolePermissionConfig, CustomerFeedback } from "../types";
import { defaultLandingContent, defaultProducts, defaultTransactions } from "../data/seedData";

// Seeding function
export async function seedDatabaseIfEmpty() {
  try {
    // 1. Check if database is already seeded by checking landing_content and brand name
    const landingDocRef = doc(db, "settings", "landing_content");
    const landingDocSnap = await getDoc(landingDocRef);
    
    let needsSeed = true;
    if (landingDocSnap.exists()) {
      const currentData = landingDocSnap.data() as LandingContent;
      if (currentData && currentData.brandName === "topota.id") {
        console.log("Database is already seeded with topota.id. Skipping seed.");
        needsSeed = false;
      } else {
        console.log("Old brand detected. Resetting database to topota.id food concept...");
      }
    }

    if (!needsSeed) {
      return;
    }

    console.log("Starting seed sequence for topota.id...");

    // 2. Seed Products (Overwriting existing prod-1 to prod-6 with food products)
    console.log("Seeding food products...");
    for (const product of defaultProducts) {
      await setDoc(doc(db, "products", product.id), product);
    }

    // 3. Seed Transactions (Overwriting existing with food transactions)
    console.log("Seeding food transactions...");
    for (const trx of defaultTransactions) {
      await setDoc(doc(db, "transactions", trx.id), trx);
    }

    // 4. Seed Demo Users
    console.log("Seeding food demo user roles...");
    const demoUsers: UserProfile[] = [
      {
        uid: "sucipto-super-admin",
        email: "sucipto.officiall@gmail.com",
        displayName: "Sucipto (Super Admin)",
        role: "admin",
        createdAt: new Date().toISOString()
      },
      {
        uid: "demo-admin",
        email: "admin@topota.id",
        displayName: "Siti Aminah (Admin)",
        role: "admin",
        createdAt: new Date().toISOString()
      },
      {
        uid: "demo-manager",
        email: "manager@topota.id",
        displayName: "Joko Widodo (Manager)",
        role: "manager",
        createdAt: new Date().toISOString()
      },
      {
        uid: "demo-viewer",
        email: "viewer@topota.id",
        displayName: "Toni Stark (Viewer)",
        role: "viewer",
        createdAt: new Date().toISOString()
      }
    ];
    for (const user of demoUsers) {
      await setDoc(doc(db, "users", user.uid), user);
    }

    // 5. Seed Landing Content LAST to lock down isUnseeded()
    console.log("Seeding default landing content to lock database...");
    await setDoc(landingDocRef, defaultLandingContent);

    console.log("Database seeding completed and locked successfully with topota.id.");
  } catch (err) {
    console.error("Error during database seeding:", err);
  }
}

// ---------------------------------------------
// Landing Content Services
// ---------------------------------------------
export function subscribeToLandingContent(callback: (content: LandingContent) => void) {
  const landingDocRef = doc(db, "settings", "landing_content");
  return onSnapshot(landingDocRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as LandingContent);
    } else {
      callback(defaultLandingContent);
    }
  }, (err) => {
    console.warn("subscribeToLandingContent permission restriction or error:", err);
    callback(defaultLandingContent);
  });
}

export async function updateLandingContent(content: LandingContent): Promise<void> {
  const landingDocRef = doc(db, "settings", "landing_content");
  await setDoc(landingDocRef, content, { merge: true });
}

// ---------------------------------------------
// Product Services (Real-time Inventory)
// ---------------------------------------------
export function subscribeToProducts(callback: (products: Product[]) => void) {
  const productsCollRef = collection(db, "products");
  const q = query(productsCollRef, orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    const products: Product[] = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    callback(products);
  }, (err) => {
    console.warn("subscribeToProducts permission restriction or error:", err);
    callback([]);
  });
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const productsCollRef = collection(db, "products");
    const q = query(productsCollRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    const products: Product[] = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    return products;
  } catch (err) {
    console.error("Error in fetchProducts:", err);
    return [];
  }
}

export async function addProduct(product: Omit<Product, "id" | "soldCount" | "createdAt" | "updatedAt">): Promise<void> {
  const productDocRef = doc(collection(db, "products"));
  const now = new Date().toISOString();
  const newProduct: Product = {
    ...product,
    id: productDocRef.id,
    soldCount: 0,
    createdAt: now,
    updatedAt: now
  };
  await setDoc(productDocRef, newProduct);
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<void> {
  const productDocRef = doc(db, "products", id);
  await updateDoc(productDocRef, {
    ...productData,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const productDocRef = doc(db, "products", id);
  await deleteDoc(productDocRef);
}

// ---------------------------------------------
// Transactions Services
// ---------------------------------------------
export function subscribeToTransactions(callback: (transactions: Transaction[]) => void) {
  const transactionsCollRef = collection(db, "transactions");
  const q = query(transactionsCollRef, orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = [];
    snapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() } as Transaction);
    });
    callback(transactions);
  }, (err) => {
    console.warn("subscribeToTransactions permission restriction or error:", err);
    callback([]);
  });
}

export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const transactionsCollRef = collection(db, "transactions");
    const q = query(transactionsCollRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    snapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() } as Transaction);
    });
    return transactions;
  } catch (err) {
    console.error("Error in fetchTransactions:", err);
    return [];
  }
}

// Transaction Logging & Real-time Stock Update (Atomic)
export async function createTransaction(transaction: Omit<Transaction, "id" | "date">): Promise<string> {
  const trxDocRef = doc(collection(db, "transactions"));
  const now = new Date().toISOString();
  const id = trxDocRef.id;

  // Execute a Firestore transaction to ensure atomic stock decrement and transaction write
  await runTransaction(db, async (firestoreTransaction) => {
    // 1. Read and check product stocks first
    const productRefsAndData: { ref: any, currentStock: number, currentSold: number, item: typeof transaction.items[0] }[] = [];
    
    for (const item of transaction.items) {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await firestoreTransaction.get(productRef);
      if (!productSnap.exists()) {
        throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
      }
      const data = productSnap.data() as Product;
      if (data.stock < item.quantity) {
        throw new Error(`Stok produk "${data.name}" tidak mencukupi (Tersedia: ${data.stock}, Diminta: ${item.quantity}).`);
      }
      productRefsAndData.push({
        ref: productRef,
        currentStock: data.stock,
        currentSold: data.soldCount || 0,
        item
      });
    }

    // 2. Perform updates inside the transaction
    for (const { ref, currentStock, currentSold, item } of productRefsAndData) {
      firestoreTransaction.update(ref, {
        stock: currentStock - item.quantity,
        soldCount: currentSold + item.quantity,
        updatedAt: now
      });
    }

    // 3. Write transaction record
    const fullTransaction: Transaction = {
      ...transaction,
      id,
      date: now
    };
    firestoreTransaction.set(trxDocRef, fullTransaction);
  });

  return id;
}

// ---------------------------------------------
// User Profile Services (Role-based access)
// ---------------------------------------------
export function subscribeToUserProfiles(callback: (users: UserProfile[]) => void) {
  const usersCollRef = collection(db, "users");
  const q = query(usersCollRef, orderBy("email", "asc"));
  return onSnapshot(q, (snapshot) => {
    const users: UserProfile[] = [];
    snapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() } as UserProfile);
    });
    callback(users);
  }, (err) => {
    console.warn("subscribeToUserProfiles permission restriction or error:", err);
    callback([]);
  });
}

export async function getOrCreateUserProfile(uid: string, email: string, displayName: string): Promise<UserProfile> {
  const userDocRef = doc(db, "users", uid);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  } else {
    // Determine initial role: if first email or specific, give admin, otherwise viewer
    let role: UserRole = "viewer";
    if (email.includes("admin") || email === "sucipto.officiall@gmail.com") {
      role = "admin";
    }

    const newUser: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split("@")[0],
      role,
      createdAt: new Date().toISOString()
    };
    await setDoc(userDocRef, newUser);
    return newUser;
  }
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, { role });
}

export async function findUserProfileByEmail(email: string): Promise<UserProfile | null> {
  try {
    const usersCollRef = collection(db, "users");
    const snapshot = await getDocs(usersCollRef);
    let found: UserProfile | null = null;
    snapshot.forEach((doc) => {
      const data = doc.data() as UserProfile;
      if (data.email && data.email.toLowerCase() === email.toLowerCase()) {
        found = { uid: doc.id, ...data };
      }
    });
    return found;
  } catch (err) {
    console.error("Error in findUserProfileByEmail:", err);
    return null;
  }
}

export async function createUserProfile(email: string, displayName: string, role: UserRole): Promise<string> {
  const uid = "user-" + Math.random().toString(36).substring(2, 11);
  const newUser: UserProfile = {
    uid,
    email,
    displayName,
    role,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, "users", uid), newUser);
  return uid;
}

export async function deleteUserProfile(uid: string): Promise<void> {
  const userDocRef = doc(db, "users", uid);
  await deleteDoc(userDocRef);
}

// ---------------------------------------------
// Granular Role & Permission Configuration Services
// ---------------------------------------------
export const defaultRolePermissions: RolePermissionConfig[] = [
  {
    roleId: "admin",
    displayName: "Full Admin (Super Admin)",
    editProducts: true,
    editLanding: true,
    editSuppliers: true,
    manageBackups: true,
    manageRoles: true,
    viewTransactions: true
  },
  {
    roleId: "manager",
    displayName: "Can Edit Inventory (Manager)",
    editProducts: true,
    editLanding: false,
    editSuppliers: true,
    manageBackups: true,
    manageRoles: false,
    viewTransactions: true
  },
  {
    roleId: "viewer",
    displayName: "View-only (Staff)",
    editProducts: false,
    editLanding: false,
    editSuppliers: false,
    manageBackups: false,
    manageRoles: false,
    viewTransactions: true
  }
];

export function subscribeToRolePermissions(callback: (configs: RolePermissionConfig[]) => void) {
  const permDocRef = doc(db, "settings", "role_permissions");
  return onSnapshot(permDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data && Array.isArray(data.roles)) {
        callback(data.roles as RolePermissionConfig[]);
        return;
      }
    }
    callback(defaultRolePermissions);
  }, (err) => {
    console.warn("subscribeToRolePermissions permission restriction or error, using default:", err);
    callback(defaultRolePermissions);
  });
}

export async function updateRolePermissions(configs: RolePermissionConfig[]): Promise<void> {
  const permDocRef = doc(db, "settings", "role_permissions");
  await setDoc(permDocRef, { roles: configs }, { merge: true });
}

// ---------------------------------------------
// Inventory Backup Services (Safety Snapshots)
// ---------------------------------------------
export async function createInventoryBackup(createdBy: string, products: Product[], note?: string): Promise<string> {
  const backupCollRef = collection(db, "inventory_backups");
  const backupDocRef = doc(backupCollRef);
  const now = new Date().toISOString();
  
  const backupData: InventoryBackup = {
    id: backupDocRef.id,
    createdAt: now,
    createdBy,
    itemCount: products.length,
    products: products.map(p => ({ ...p })),
    note: note || "Manual Snapshot"
  };
  
  await setDoc(backupDocRef, backupData);
  return backupDocRef.id;
}

export function subscribeToInventoryBackups(callback: (backups: InventoryBackup[]) => void) {
  const backupCollRef = collection(db, "inventory_backups");
  const q = query(backupCollRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const backups: InventoryBackup[] = [];
    snapshot.forEach((doc) => {
      backups.push({ id: doc.id, ...doc.data() } as InventoryBackup);
    });
    callback(backups);
  }, (err) => {
    console.warn("subscribeToInventoryBackups permission restriction or error:", err);
    callback([]);
  });
}

export async function deleteInventoryBackup(id: string): Promise<void> {
  const backupDocRef = doc(db, "inventory_backups", id);
  await deleteDoc(backupDocRef);
}

// ---------------------------------------------
// Supplier Services
// ---------------------------------------------
export function subscribeToSuppliers(callback: (suppliers: Supplier[]) => void) {
  const suppliersCollRef = collection(db, "suppliers");
  const q = query(suppliersCollRef, orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    const suppliers: Supplier[] = [];
    snapshot.forEach((doc) => {
      suppliers.push({ id: doc.id, ...doc.data() } as Supplier);
    });
    callback(suppliers);
  }, (err) => {
    console.warn("subscribeToSuppliers permission restriction or error:", err);
    callback([]);
  });
}

export async function addSupplier(supplierData: Omit<Supplier, "id" | "createdAt" | "updatedAt">): Promise<void> {
  const supplierDocRef = doc(collection(db, "suppliers"));
  const now = new Date().toISOString();
  const newSupplier: Supplier = {
    ...supplierData,
    id: supplierDocRef.id,
    createdAt: now,
    updatedAt: now
  };
  await setDoc(supplierDocRef, newSupplier);
}

export async function updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<void> {
  const supplierDocRef = doc(db, "suppliers", id);
  await updateDoc(supplierDocRef, {
    ...supplierData,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteSupplier(id: string): Promise<void> {
  const supplierDocRef = doc(db, "suppliers", id);
  await deleteDoc(supplierDocRef);
}

// ---------------------------------------------
// Customer Feedback (CRM Submissions) Services
// ---------------------------------------------
export function subscribeToFeedbacks(callback: (feedbacks: CustomerFeedback[]) => void) {
  const feedbacksCollRef = collection(db, "feedbacks");
  const q = query(feedbacksCollRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const feedbacks: CustomerFeedback[] = [];
    snapshot.forEach((doc) => {
      feedbacks.push({ id: doc.id, ...doc.data() } as CustomerFeedback);
    });
    callback(feedbacks);
  }, (err) => {
    console.warn("subscribeToFeedbacks permission restriction or error:", err);
    callback([]);
  });
}

export async function addFeedback(feedback: Omit<CustomerFeedback, "id" | "createdAt" | "status">): Promise<void> {
  const feedbackDocRef = doc(collection(db, "feedbacks"));
  const now = new Date().toISOString();
  const newFeedback: CustomerFeedback = {
    ...feedback,
    id: feedbackDocRef.id,
    status: "Baru",
    createdAt: now
  };
  await setDoc(feedbackDocRef, newFeedback);
}

export async function updateFeedback(id: string, feedbackData: Partial<CustomerFeedback>): Promise<void> {
  const feedbackDocRef = doc(db, "feedbacks", id);
  await updateDoc(feedbackDocRef, feedbackData);
}

export async function deleteFeedback(id: string): Promise<void> {
  const feedbackDocRef = doc(db, "feedbacks", id);
  await deleteDoc(feedbackDocRef);
}


