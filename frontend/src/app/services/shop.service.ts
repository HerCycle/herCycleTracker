import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount?: number;
  stock: number;
  rating?: number;
  reviewsCount?: number;
  brand?: string;
  category?: string;
  imageUrl?: string;
}

export interface PaginatedProducts {
  content: Product[];
  pageable: any;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // current page number
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Cart {
  id?: number;
  cartItems: CartItem[];
  totalAmount: number;
}

export interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  imageUrl?: string;
}

export interface Address {
  id?: number;
  fullName: string;
  phone: string;
  houseNo: string;
  street: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id?: number;
  orderNumber?: string;
  addressId: number;
  address?: Address;
  paymentMethod: string; // e.g. "COD"
  paymentStatus?: string;
  orderStatus?: string;
  deliveryStatus?: string;
  orderItems?: OrderItem[];
  subtotal?: number;
  discountAmount?: number;
  totalAmount?: number;
  couponCode?: string;
  orderDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private readonly api = inject(ApiService);

  // --- Products ---
  getProducts(page = 0, size = 10, sortBy = 'id', sortDir = 'desc'): Observable<ApiResponse<PaginatedProducts>> {
    return this.api.get<PaginatedProducts>(`/api/products?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  }

  searchProducts(query: string, page = 0, size = 10, sortBy = 'id', sortDir = 'desc'): Observable<ApiResponse<PaginatedProducts>> {
    return this.api.get<PaginatedProducts>(`/api/products/search?query=${query}&page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  }

  filterProducts(category: string, page = 0, size = 10, sortBy = 'id', sortDir = 'desc'): Observable<ApiResponse<PaginatedProducts>> {
    return this.api.get<PaginatedProducts>(`/api/products/filter?category=${category}&page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  }

  getProductDetails(id: number): Observable<ApiResponse<Product>> {
    return this.api.get<Product>(`/api/products/${id}`);
  }

  addProduct(product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.api.post<Product>('/api/products', product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.api.put<Product>(`/api/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/api/products/${id}`);
  }

  // --- Cart ---
  getCart(): Observable<ApiResponse<Cart>> {
    return this.api.get<Cart>('/api/cart');
  }

  addToCart(productId: number, quantity: number): Observable<ApiResponse<Cart>> {
    return this.api.post<Cart>('/api/cart', { productId, quantity });
  }

  updateCartItem(cartItemId: number, quantity: number): Observable<ApiResponse<Cart>> {
    return this.api.put<Cart>(`/api/cart/${cartItemId}?quantity=${quantity}`, {});
  }

  removeCartItem(cartItemId: number): Observable<ApiResponse<Cart>> {
    return this.api.delete<Cart>(`/api/cart/${cartItemId}`);
  }

  clearCart(): Observable<ApiResponse<void>> {
    return this.api.delete<void>('/api/cart');
  }

  // --- Wishlist ---
  getWishlist(): Observable<ApiResponse<WishlistItem[]>> {
    return this.api.get<WishlistItem[]>('/api/wishlist');
  }

  addToWishlist(productId: number): Observable<ApiResponse<WishlistItem>> {
    return this.api.post<WishlistItem>(`/api/wishlist?productId=${productId}`, {});
  }

  removeFromWishlist(productId: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/api/wishlist/${productId}`);
  }

  // --- Addresses ---
  getAddresses(): Observable<ApiResponse<Address[]>> {
    return this.api.get<Address[]>('/api/addresses');
  }

  addAddress(address: Address): Observable<ApiResponse<Address>> {
    return this.api.post<Address>('/api/addresses', address);
  }

  updateAddress(id: number, address: Address): Observable<ApiResponse<Address>> {
    return this.api.put<Address>(`/api/addresses/${id}`, address);
  }

  deleteAddress(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/api/addresses/${id}`);
  }

  // --- Orders ---
  placeOrder(orderRequest: { addressId: number; paymentMethod: string; couponCode?: string }): Observable<ApiResponse<Order>> {
    return this.api.post<Order>('/api/orders', orderRequest);
  }

  getOrderHistory(): Observable<ApiResponse<Order[]>> {
    return this.api.get<Order[]>('/api/orders');
  }

  trackOrder(orderId: number): Observable<ApiResponse<Order>> {
    return this.api.get<Order>(`/api/orders/${orderId}`);
  }

  cancelOrder(orderId: number): Observable<ApiResponse<Order>> {
    return this.api.put<Order>(`/api/orders/${orderId}/cancel`, {});
  }

  updateOrderStatus(orderId: number, status: string): Observable<ApiResponse<Order>> {
    return this.api.put<Order>(`/api/orders/${orderId}/status?status=${status}`, {});
  }
}
