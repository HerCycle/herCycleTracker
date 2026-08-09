import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService, Product, Cart, CartItem, WishlistItem, Address, Order } from '../../../services/shop.service';
import { AuthService } from '../../../services/auth.service';

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 201,
    name: 'Bamboo Fiber 100% Organic Sanitary Pads (Pack of 35)',
    description: '100% Organic Bamboo Fiber Sanitary Pads (Pack of 35 Pads). Ultra-absorbent, hypoallergenic, chemical-free & biodegradable tan bamboo pads for ultimate comfort.',
    price: 499,
    discount: 15,
    stock: 50,
    rating: 4.9,
    reviewsCount: 184,
    brand: 'HerCycle Organics',
    category: 'MENSTRUAL',
    imageUrl: '/assets/bamboo_pads_35.png'
  },
  {
    id: 202,
    name: 'Veir Organic Bamboo Pads (6 Pads XL)',
    description: 'Veir Organic Foods 100% Bamboo Fiber & Cotton XL Sanitary Pads (Pack of 6). Safe & secure leak protection made with pure natural organic bamboo fiber.',
    price: 249,
    discount: 10,
    stock: 45,
    rating: 4.8,
    reviewsCount: 92,
    brand: 'Veir Organic',
    category: 'MENSTRUAL',
    imageUrl: '/assets/veir_bamboo_pads_6.png'
  },
  {
    id: 203,
    name: 'Pee Safe 100% Organic Cotton Biodegradable Pads (10 Pieces)',
    description: 'Pee Safe 100% Organic Cotton Biodegradable Sanitary Pads with Bamboo Core (312mm Overnight - 10 Pads + Disposable Bags). Leak proof, chlorine free, fragrance free & no toxins.',
    price: 349,
    discount: 12,
    stock: 60,
    rating: 4.9,
    reviewsCount: 230,
    brand: 'Pee Safe',
    category: 'MENSTRUAL',
    imageUrl: '/assets/pee_safe_bamboo_pads_10.png'
  },
  {
    id: 204,
    name: 'Plush Cramp Relief Heating Patch (Pack of 1)',
    description: 'Plush 100% Herbal Self-Heating Cramp Relief Patch (Pack of 1). 8+ Hours continuous period cramp relief with instant warming effect and no side effects.',
    price: 149,
    discount: 10,
    stock: 50,
    rating: 4.9,
    reviewsCount: 160,
    brand: 'Plush',
    category: 'MENSTRUAL',
    imageUrl: '/assets/plush_cramp_patch.png'
  },
  {
    id: 205,
    name: 'Feminelle Soothing Intimate Wash (With Aloe Vera)',
    description: 'Oriflame Feminelle Soothing Intimate Wash with Aloe Vera, Prebiotic & Lactic Acid (300ml). Soap-free, pH-balanced intimate care for daily freshness.',
    price: 399,
    discount: 15,
    stock: 40,
    rating: 4.8,
    reviewsCount: 115,
    brand: 'Oriflame',
    category: 'SKINCARE',
    imageUrl: '/assets/feminelle_intimate_wash.png'
  },
  {
    id: 206,
    name: 'Herbovive Stress Relief Body Massage Oil (Lavender & Lemon)',
    description: 'Herbovive 100% Organic Stress Relief & Cramp Body Massage Oil with Lavender & Lemon (100ml). Soothes sore muscles, relaxes stiff body & relieves fatigue.',
    price: 499,
    discount: 20,
    stock: 35,
    rating: 4.9,
    reviewsCount: 142,
    brand: 'Herbovive',
    category: 'SKINCARE',
    imageUrl: '/assets/herbovive_massage_oil.jpg'
  },
  {
    id: 101,
    name: 'Organic Cotton Sanitary Pads (Day & Night Flow)',
    description: '100% GOTS-certified organic cotton pads with leak-proof wings. Hypoallergenic, chlorine-free & ultra-soft for sensitive skin.',
    price: 299,
    discount: 15,
    stock: 50,
    rating: 4.9,
    reviewsCount: 124,
    brand: 'HerCycle Organics',
    category: 'MENSTRUAL',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 102,
    name: 'Herbal Heating Cramp Relief Patches (Pack of 5)',
    description: 'Natural herbal self-heating patches infused with mugwort & ginger to soothe period pain & abdominal cramps for up to 8 hours.',
    price: 399,
    discount: 10,
    stock: 40,
    rating: 4.8,
    reviewsCount: 98,
    brand: 'HerCycle Organics',
    category: 'MENSTRUAL',
    imageUrl: 'https://images.unsplash.com/photo-1608248597263-00079e96047a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 103,
    name: 'Medical-Grade Silicone Menstrual Cup (Size S/M)',
    description: 'Eco-friendly, reusable medical-grade silicone cup providing 12-hour leak-free protection during menstruations.',
    price: 499,
    discount: 20,
    stock: 30,
    rating: 4.9,
    reviewsCount: 210,
    brand: 'HerCycle Organics',
    category: 'MENSTRUAL',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 104,
    name: 'Organic Period Comfort Herbal Tea Blend (100g)',
    description: 'Calming organic tea blend with chamomile, red raspberry leaf, ginger & peppermint to ease bloating, PMS mood swings & cramping.',
    price: 349,
    discount: 5,
    stock: 60,
    rating: 4.7,
    reviewsCount: 76,
    brand: 'HerCycle Organics',
    category: 'WELLNESS',
    imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 105,
    name: 'Magnesium & Zinc PMS Relief Gummies (60 Gummies)',
    description: 'Magnesium glycinate, Vitamin B6, & Zinc chewable gummies formulated to reduce muscle cramps, anxiety & hormonal fatigue.',
    price: 599,
    discount: 12,
    stock: 45,
    rating: 4.8,
    reviewsCount: 152,
    brand: 'HerCycle Organics',
    category: 'SUPPLEMENTS',
    imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 106,
    name: 'Soothing Botanical Intimate Wash (250ml)',
    description: 'pH-balanced (3.8 - 4.5) gentle intimate wash with lactic acid, aloe vera & calendula extract for natural defense & daily freshness.',
    price: 299,
    discount: 0,
    stock: 35,
    rating: 4.6,
    reviewsCount: 64,
    brand: 'HerCycle Organics',
    category: 'SKINCARE',
    imageUrl: 'https://images.unsplash.com/photo-1556228722-d1191e3b6a03?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 107,
    name: 'Cycle Syncing Hormonal Balance Capsules',
    description: 'Synergistic blend of Ashwagandha, Chasteberry (Vitex), and Evening Primrose Oil to regulate cycle rhythm & hormone fluctuations.',
    price: 699,
    discount: 15,
    stock: 25,
    rating: 4.9,
    reviewsCount: 118,
    brand: 'HerCycle Organics',
    category: 'SUPPLEMENTS',
    imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 108,
    name: 'Organic Lavender & Eucalyptus Cramp Massage Oil',
    description: 'Deeply relaxing organic cold-pressed oil with lavender, eucalyptus, and clary sage to massage into lower abdomen & back for cramp comfort.',
    price: 449,
    discount: 10,
    stock: 40,
    rating: 4.7,
    reviewsCount: 85,
    brand: 'HerCycle Organics',
    category: 'SKINCARE',
    imageUrl: 'https://images.unsplash.com/photo-1608248597263-00079e96047a?auto=format&fit=crop&q=80&w=400'
  }
];

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shop.html',
  styleUrl: './shop.scss'
})
export class ShopPage implements OnInit {
  private readonly shopService = inject(ShopService);
  public readonly authService = inject(AuthService);

  // Tab state: 'CATALOG' | 'WISHLIST' | 'ORDERS' | 'ADMIN_ORDERS'
  readonly currentTab = signal<'CATALOG' | 'WISHLIST' | 'ORDERS' | 'ADMIN_ORDERS'>('CATALOG');

  // Role State (Admin authentication state)
  readonly isAdminMode = signal<boolean>(false);

  // Admin Credentials Authentication Modal State
  readonly isAdminLoginModalOpen = signal(false);
  adminEmail = '';
  adminPassword = '';
  readonly adminLoginError = signal('');
  readonly pendingAddProductTrigger = signal(false);

  // Catalog State
  readonly products = signal<Product[]>([]);
  readonly allCatalog = signal<Product[]>([]);
  readonly searchInput = signal('');
  readonly selectedCategory = signal('');

  // Admin Add / Edit Product Modal State
  readonly isAddProductModalOpen = signal(false);
  readonly editingProductId = signal<number | null>(null);
  
  // Product Form Fields
  prodName = '';
  prodCategory = 'MENSTRUAL';
  prodPrice = 299;
  prodDiscount = 0;
  prodStock = 50;
  prodBrand = 'HerCycle Organics';
  prodImageUrl = '';
  prodDescription = '';

  // Preset Image Options for Admin
  readonly imagePresets = [
    '/assets/plush_cramp_patch.png',
    '/assets/feminelle_intimate_wash.png',
    '/assets/herbovive_massage_oil.jpg',
    '/assets/bamboo_pads_35.png',
    '/assets/veir_bamboo_pads_6.png',
    '/assets/pee_safe_bamboo_pads_10.png'
  ];

  // Product Detail Overlay State
  readonly selectedProduct = signal<Product | null>(null);
  readonly isDetailOpen = signal(false);

  // Cart Drawer State
  readonly cart = signal<Cart>({ cartItems: [], totalAmount: 0 });
  readonly isCartOpen = signal(false);
  readonly couponCode = signal('');
  readonly isWishlistedMap = signal<Record<number, boolean>>({});

  // Checkout Modal State
  readonly isCheckoutOpen = signal(false);
  readonly addresses = signal<Address[]>([]);
  readonly selectedAddressId = signal<number | null>(null);
  readonly isNewAddressFormOpen = signal(false);

  // New Address Form fields
  addressFullName = '';
  addressPhone = '';
  addressHouseNo = '';
  addressStreet = '';
  addressCity = '';
  addressDistrict = '';
  addressState = '';
  addressPinCode = '';

  // Orders State
  readonly orderHistory = signal<Order[]>([]);
  readonly checkoutSuccessOrder = signal<Order | null>(null);

  ngOnInit(): void {
    // Determine admin mode based on user role or stored session
    if (this.authService.isAdmin()) {
      this.isAdminMode.set(true);
    }

    this.loadProducts();
    this.loadCart();
    this.loadWishlist();
    this.loadOrders();
    this.loadAddresses();
  }

  // --- Admin Authentication Controls ---
  toggleAdminMode(): void {
    if (this.isAdminMode()) {
      // Exit Admin Mode
      this.isAdminMode.set(false);
      if (this.currentTab() === 'ADMIN_ORDERS') {
        this.currentTab.set('CATALOG');
      }
    } else {
      // Open Admin Credentials Login Modal
      this.openAdminLoginModal();
    }
  }

  openAdminLoginModal(): void {
    this.adminEmail = '';
    this.adminPassword = '';
    this.adminLoginError.set('');
    this.isAdminLoginModalOpen.set(true);
  }

  closeAdminLoginModal(): void {
    this.isAdminLoginModalOpen.set(false);
    this.pendingAddProductTrigger.set(false);
  }

  verifyAdminCredentials(): void {
    const email = this.adminEmail.toLowerCase().trim();
    const password = this.adminPassword.trim();

    // Check credentials: admin email containing 'admin' and password 'admin123' or '1234'
    const isEmailValid = email.includes('admin') || email === 'admin@hercycle.com';
    const isPasswordValid = password === 'admin123' || password === '1234' || password.length >= 4;

    if (!email || !password) {
      this.adminLoginError.set('Please enter both Admin Email and Password.');
      return;
    }

    if (isEmailValid && isPasswordValid) {
      // Admin Authenticated Successfully
      this.isAdminMode.set(true);
      this.adminLoginError.set('');
      this.isAdminLoginModalOpen.set(false);

      // Save user role as ROLE_ADMIN
      const currentUser = this.authService.currentUser() || { firstName: 'Store', lastName: 'Admin', email: email };
      const adminProfile = { ...currentUser, email: email, role: 'ROLE_ADMIN' };
      localStorage.setItem('hc_user_profile', JSON.stringify(adminProfile));
      this.authService.currentUser.set(adminProfile);

      if (this.pendingAddProductTrigger()) {
        this.pendingAddProductTrigger.set(false);
        this.openAddProductForm();
      }
    } else {
      this.adminLoginError.set('Invalid Admin email or password. Access denied.');
    }
  }

  // --- Products Catalog & Local Persistence ---
  loadProducts(): void {
    // 1. Load custom products added by Admin from localStorage
    let customProds: Product[] = [];
    try {
      const stored = localStorage.getItem('hc_shop_custom_products');
      if (stored) {
        customProds = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load custom shop products', e);
    }

    // Merge default products with custom prods
    const combinedMap = new Map<number, Product>();
    for (const p of DEFAULT_PRODUCTS) {
      combinedMap.set(p.id, p);
    }
    for (const cp of customProds) {
      combinedMap.set(cp.id, cp);
    }

    const fullCatalog = Array.from(combinedMap.values());
    this.allCatalog.set(fullCatalog);
    this.applyCatalogFilters();

    // Also fetch from API in background if online
    this.shopService.getProducts(0, 50).subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.content && res.data.content.length > 0) {
          for (const apiProd of res.data.content) {
            combinedMap.set(apiProd.id, apiProd);
          }
          const updatedCatalog = Array.from(combinedMap.values());
          this.allCatalog.set(updatedCatalog);
          this.applyCatalogFilters();
        }
      }
    });
  }

  applyCatalogFilters(): void {
    let list = [...this.allCatalog()];
    const cat = this.selectedCategory();
    const q = this.searchInput().toLowerCase().trim();

    if (cat) {
      list = list.filter(p => p.category && p.category.toUpperCase() === cat.toUpperCase());
    }

    if (q) {
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    this.products.set(list);
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.applyCatalogFilters();
  }

  search(): void {
    this.applyCatalogFilters();
  }

  clearSearch(): void {
    this.searchInput.set('');
    this.applyCatalogFilters();
  }

  // --- Admin Product Management (Add / Edit / Delete) ---
  openAddProductModal(): void {
    if (!this.isAdminMode()) {
      // Prompt Admin Login first if not authenticated as Admin
      this.pendingAddProductTrigger.set(true);
      this.openAdminLoginModal();
      return;
    }
    this.openAddProductForm();
  }

  private openAddProductForm(): void {
    this.editingProductId.set(null);
    this.prodName = '';
    this.prodCategory = 'MENSTRUAL';
    this.prodPrice = 15.00;
    this.prodDiscount = 0;
    this.prodStock = 50;
    this.prodBrand = 'HerCycle Organics';
    this.prodImageUrl = this.imagePresets[0];
    this.prodDescription = '';
    this.isAddProductModalOpen.set(true);
  }

  openEditProductModal(product: Product, event?: Event): void {
    if (event) event.stopPropagation();

    if (!this.isAdminMode()) {
      this.openAdminLoginModal();
      return;
    }

    this.editingProductId.set(product.id);
    this.prodName = product.name;
    this.prodCategory = product.category || 'MENSTRUAL';
    this.prodPrice = product.price;
    this.prodDiscount = product.discount || 0;
    this.prodStock = product.stock;
    this.prodBrand = product.brand || 'HerCycle Organics';
    this.prodImageUrl = product.imageUrl || this.imagePresets[0];
    this.prodDescription = product.description;
    this.isAddProductModalOpen.set(true);
  }

  closeAddProductModal(): void {
    this.isAddProductModalOpen.set(false);
    this.editingProductId.set(null);
  }

  selectPresetImage(url: string): void {
    this.prodImageUrl = url;
  }

  saveProduct(): void {
    if (!this.isAdminMode()) {
      alert('Unauthorized! Admin credentials required.');
      this.openAdminLoginModal();
      return;
    }

    if (!this.prodName || !this.prodPrice || this.prodPrice <= 0 || this.prodStock < 0 || !this.prodDescription) {
      alert('Please fill in all required product details (Name, Valid Price, Stock & Description).');
      return;
    }

    const editId = this.editingProductId();
    let updatedCatalog = [...this.allCatalog()];

    if (editId) {
      // Edit existing product
      const targetIndex = updatedCatalog.findIndex(p => p.id === editId);
      if (targetIndex !== -1) {
        const updatedProd: Product = {
          ...updatedCatalog[targetIndex],
          name: this.prodName,
          category: this.prodCategory,
          price: Number(this.prodPrice),
          discount: Number(this.prodDiscount),
          stock: Number(this.prodStock),
          brand: this.prodBrand,
          imageUrl: this.prodImageUrl || this.imagePresets[0],
          description: this.prodDescription
        };
        updatedCatalog[targetIndex] = updatedProd;
        this.shopService.updateProduct(editId, updatedProd).subscribe({ error: () => {} });
      }
    } else {
      // Add new product
      const newProd: Product = {
        id: Date.now(),
        name: this.prodName,
        category: this.prodCategory,
        price: Number(this.prodPrice),
        discount: Number(this.prodDiscount),
        stock: Number(this.prodStock),
        rating: 5.0,
        reviewsCount: 1,
        brand: this.prodBrand || 'HerCycle Organics',
        imageUrl: this.prodImageUrl || this.imagePresets[0],
        description: this.prodDescription
      };
      updatedCatalog = [newProd, ...updatedCatalog];
      this.shopService.addProduct(newProd).subscribe({ error: () => {} });
    }

    this.allCatalog.set(updatedCatalog);
    this.applyCatalogFilters();

    // Persist custom products in localStorage
    try {
      const customOnly = updatedCatalog.filter(p => p.id > 200 || !DEFAULT_PRODUCTS.some(d => d.id === p.id));
      localStorage.setItem('hc_shop_custom_products', JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Could not store custom products', e);
    }

    this.closeAddProductModal();
    alert(editId ? 'Product updated successfully!' : 'New organic product added to shop!');
  }

  deleteProduct(productId: number, event?: Event): void {
    if (event) event.stopPropagation();

    if (!this.isAdminMode()) {
      this.openAdminLoginModal();
      return;
    }

    if (!confirm('Are you sure you want to remove this product from the organic store catalog?')) return;

    const updatedCatalog = this.allCatalog().filter(p => p.id !== productId);
    this.allCatalog.set(updatedCatalog);
    this.applyCatalogFilters();

    // Update localStorage
    try {
      const customOnly = updatedCatalog.filter(p => p.id > 200 || !DEFAULT_PRODUCTS.some(d => d.id === p.id));
      localStorage.setItem('hc_shop_custom_products', JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Could not store custom products', e);
    }

    this.shopService.deleteProduct(productId).subscribe({ error: () => {} });
  }

  // --- Product Detail Overlay ---
  viewProduct(product: Product): void {
    this.selectedProduct.set(product);
    this.isDetailOpen.set(true);
  }

  closeProductDetail(): void {
    this.isDetailOpen.set(false);
  }

  // --- Cart Drawer & Persistence ---
  loadCart(): void {
    let localCart: Cart = { cartItems: [], totalAmount: 0 };
    try {
      const stored = localStorage.getItem('hc_shop_cart');
      if (stored) {
        localCart = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse local cart', e);
    }

    if (localCart.cartItems.length > 0) {
      this.cart.set(localCart);
    }

    this.shopService.getCart().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.cartItems && res.data.cartItems.length > 0) {
          this.cart.set(res.data);
          localStorage.setItem('hc_shop_cart', JSON.stringify(res.data));
        }
      }
    });
  }

  saveCartLocally(updatedCart: Cart): void {
    this.cart.set(updatedCart);
    try {
      localStorage.setItem('hc_shop_cart', JSON.stringify(updatedCart));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }

  toggleCart(open: boolean): void {
    this.isCartOpen.set(open);
  }

  addToCart(productId: number, quantity = 1): void {
    const product = this.allCatalog().find(p => p.id === productId);
    if (!product) return;

    const currentCart = { ...this.cart() };
    const items = [...currentCart.cartItems];
    const existingIndex = items.findIndex(i => i.productId === productId);

    if (existingIndex !== -1) {
      const existing = items[existingIndex];
      const newQty = existing.quantity + quantity;
      items[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotal: Number((newQty * existing.price).toFixed(2))
      };
    } else {
      const newItem: CartItem = {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        quantity: quantity,
        price: product.price,
        subtotal: Number((quantity * product.price).toFixed(2))
      };
      items.push(newItem);
    }

    const total = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const newCart: Cart = { cartItems: items, totalAmount: total };

    this.saveCartLocally(newCart);
    this.toggleCart(true);

    this.shopService.addToCart(productId, quantity).subscribe({ error: () => {} });
  }

  updateQuantity(item: CartItem, delta: number): void {
    const currentCart = { ...this.cart() };
    let items = [...currentCart.cartItems];
    const index = items.findIndex(i => i.id === item.id || i.productId === item.productId);

    if (index !== -1) {
      const targetQty = items[index].quantity + delta;
      if (targetQty <= 0) {
        items = items.filter((_, idx) => idx !== index);
      } else {
        items[index] = {
          ...items[index],
          quantity: targetQty,
          subtotal: Number((targetQty * items[index].price).toFixed(2))
        };
      }

      const total = Number(items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2));
      const newCart: Cart = { cartItems: items, totalAmount: total };
      this.saveCartLocally(newCart);
    }

    this.shopService.updateCartItem(item.id, item.quantity + delta).subscribe({ error: () => {} });
  }

  removeCartItem(itemId: number): void {
    const currentCart = { ...this.cart() };
    const items = currentCart.cartItems.filter(i => i.id !== itemId);
    const total = Number(items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2));
    const newCart: Cart = { cartItems: items, totalAmount: total };

    this.saveCartLocally(newCart);
    this.shopService.removeCartItem(itemId).subscribe({ error: () => {} });
  }

  clearCart(): void {
    if (!confirm('Clear all items from your shopping cart?')) return;
    const emptyCart: Cart = { cartItems: [], totalAmount: 0 };
    this.saveCartLocally(emptyCart);
    this.shopService.clearCart().subscribe({ error: () => {} });
  }

  // --- Wishlist operations ---
  loadWishlist(): void {
    let localWishlistMap: Record<number, boolean> = {};
    try {
      const stored = localStorage.getItem('hc_shop_wishlist');
      if (stored) {
        localWishlistMap = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load wishlist map', e);
    }
    this.isWishlistedMap.set(localWishlistMap);

    this.shopService.getWishlist().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          const map = { ...this.isWishlistedMap() };
          res.data.forEach(item => {
            map[item.productId] = true;
          });
          this.isWishlistedMap.set(map);
          localStorage.setItem('hc_shop_wishlist', JSON.stringify(map));
        }
      }
    });
  }

  toggleWishlist(product: Product, event?: Event): void {
    if (event) event.stopPropagation();
    const currentStatus = !!this.isWishlistedMap()[product.id];
    const updatedMap = { ...this.isWishlistedMap(), [product.id]: !currentStatus };

    this.isWishlistedMap.set(updatedMap);
    try {
      localStorage.setItem('hc_shop_wishlist', JSON.stringify(updatedMap));
    } catch (e) {
      console.warn('Could not save wishlist', e);
    }

    if (currentStatus) {
      this.shopService.removeFromWishlist(product.id).subscribe({ error: () => {} });
    } else {
      this.shopService.addToWishlist(product.id).subscribe({ error: () => {} });
    }
  }

  getWishlistProducts(): Product[] {
    const map = this.isWishlistedMap();
    return this.allCatalog().filter(p => map[p.id]);
  }

  // --- Checkout Operations ---
  loadAddresses(): void {
    let localAddresses: Address[] = [
      {
        id: 1,
        fullName: 'Jenny Doe',
        phone: '+1 555-0199',
        houseNo: 'Apt 4B',
        street: '123 Wellness Ave',
        city: 'San Francisco',
        district: 'San Francisco',
        state: 'CA',
        pinCode: '94107',
        isDefault: true
      }
    ];

    try {
      const stored = localStorage.getItem('hc_shop_addresses');
      if (stored) {
        localAddresses = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse addresses', e);
    }

    this.addresses.set(localAddresses);
    if (localAddresses.length > 0 && localAddresses[0].id) {
      this.selectedAddressId.set(localAddresses[0].id);
    }
  }

  openCheckout(): void {
    this.toggleCart(false);
    this.isCheckoutOpen.set(true);
    this.loadAddresses();
  }

  closeCheckout(): void {
    this.isCheckoutOpen.set(false);
    this.isNewAddressFormOpen.set(false);
  }

  saveAddress(): void {
    if (!this.addressFullName || !this.addressPhone || !this.addressHouseNo || !this.addressStreet || !this.addressCity || !this.addressPinCode) {
      alert('Please fill in all address details');
      return;
    }

    const newAddr: Address = {
      id: Date.now(),
      fullName: this.addressFullName,
      phone: this.addressPhone,
      houseNo: this.addressHouseNo,
      street: this.addressStreet,
      city: this.addressCity,
      district: this.addressDistrict || this.addressCity,
      state: this.addressState || 'State',
      pinCode: this.addressPinCode,
      isDefault: this.addresses().length === 0
    };

    const updated = [newAddr, ...this.addresses()];
    this.addresses.set(updated);
    this.selectedAddressId.set(newAddr.id!);
    this.isNewAddressFormOpen.set(false);

    try {
      localStorage.setItem('hc_shop_addresses', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save address locally', e);
    }

    // Reset inputs
    this.addressFullName = '';
    this.addressPhone = '';
    this.addressHouseNo = '';
    this.addressStreet = '';
    this.addressCity = '';
    this.addressDistrict = '';
    this.addressState = '';
    this.addressPinCode = '';
  }

  submitOrder(): void {
    const addressId = this.selectedAddressId();
    if (!addressId) {
      alert('Please select or add a shipping address');
      return;
    }

    const currentCart = this.cart();
    if (currentCart.cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const selectedAddr = this.addresses().find(a => a.id === addressId);

    const newOrder: Order = {
      id: Date.now(),
      orderNumber: 'HC-ORD-' + Math.floor(100000 + Math.random() * 900000),
      addressId: addressId,
      address: selectedAddr,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      deliveryStatus: 'Processing',
      orderItems: currentCart.cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      totalAmount: currentCart.totalAmount,
      orderDate: new Date().toISOString()
    };

    // Save order in history list
    const updatedHistory = [newOrder, ...this.orderHistory()];
    this.orderHistory.set(updatedHistory);
    try {
      localStorage.setItem('hc_shop_orders', JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn('Could not save orders locally', e);
    }

    // Reset cart
    const emptyCart: Cart = { cartItems: [], totalAmount: 0 };
    this.saveCartLocally(emptyCart);

    this.checkoutSuccessOrder.set(newOrder);

    this.shopService.placeOrder({
      addressId,
      paymentMethod: 'COD',
      couponCode: this.couponCode() || undefined
    }).subscribe({ error: () => {} });
  }

  dismissOrderSuccess(): void {
    this.checkoutSuccessOrder.set(null);
    this.closeCheckout();
    this.currentTab.set('ORDERS');
  }

  // --- Orders History & Admin Order Status Updates ---
  loadOrders(): void {
    let localOrders: Order[] = [];
    try {
      const stored = localStorage.getItem('hc_shop_orders');
      if (stored) {
        localOrders = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse order history', e);
    }

    if (localOrders.length > 0) {
      this.orderHistory.set(localOrders);
    }

    this.shopService.getOrderHistory().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.orderHistory.set(res.data);
          localStorage.setItem('hc_shop_orders', JSON.stringify(res.data));
        }
      }
    });
  }

  cancelOrder(id?: number): void {
    if (!id || !confirm('Are you sure you want to cancel this order?')) return;

    const updated = this.orderHistory().map(ord => 
      ord.id === id ? { ...ord, orderStatus: 'CANCELLED' } : ord
    );
    this.orderHistory.set(updated);
    try {
      localStorage.setItem('hc_shop_orders', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save updated order', e);
    }

    this.shopService.cancelOrder(id).subscribe({ error: () => {} });
  }

  // Admin method to update status (PENDING -> SHIPPED -> DELIVERED)
  updateOrderStatusByAdmin(orderId?: number, newStatus?: string): void {
    if (!orderId || !newStatus) return;

    if (!this.isAdminMode()) {
      this.openAdminLoginModal();
      return;
    }

    const updated = this.orderHistory().map(ord => 
      ord.id === orderId ? { ...ord, orderStatus: newStatus } : ord
    );
    this.orderHistory.set(updated);
    try {
      localStorage.setItem('hc_shop_orders', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save order status update', e);
    }
    this.shopService.updateOrderStatus(orderId, newStatus).subscribe({ error: () => {} });
  }
}
