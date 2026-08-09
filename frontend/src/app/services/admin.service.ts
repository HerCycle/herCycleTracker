import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { Observable } from 'rxjs';
import { Product, Order } from './shop.service';
import { Video } from './self-care.service';

export interface AdminStats {
  totalUsers: number;
  activeUsersToday: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  popularProducts: Product[];
  recentFeedback: Feedback[];
}

export interface Feedback {
  id?: number;
  rating: number;
  message: string;
  userEmail?: string;
  userName?: string;
  createdAt?: string;
}

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  age?: number;
  weight?: number;
  height?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly api = inject(ApiService);

  // --- Dashboard Stats ---
  getDashboardStats(): Observable<ApiResponse<AdminStats>> {
    return this.api.get<AdminStats>('/api/admin/dashboard/stats');
  }

  // --- Users management ---
  getUsers(): Observable<ApiResponse<AdminUser[]>> {
    return this.api.get<AdminUser[]>('/api/admin/users');
  }

  // --- Feedback ---
  getAllFeedback(): Observable<ApiResponse<Feedback[]>> {
    return this.api.get<Feedback[]>('/api/admin/feedback');
  }

  submitFeedback(feedback: Feedback): Observable<ApiResponse<Feedback>> {
    return this.api.post<Feedback>('/api/feedback', feedback);
  }

  // --- Admin Orders ---
  getAllOrders(): Observable<ApiResponse<Order[]>> {
    return this.api.get<Order[]>('/api/admin/orders');
  }

  updateOrderStatus(
    orderId: number, 
    orderStatus?: string, 
    deliveryStatus?: string
  ): Observable<ApiResponse<Order>> {
    let query = '';
    if (orderStatus && deliveryStatus) {
      query = `?orderStatus=${orderStatus}&deliveryStatus=${deliveryStatus}`;
    } else if (orderStatus) {
      query = `?orderStatus=${orderStatus}`;
    } else if (deliveryStatus) {
      query = `?deliveryStatus=${deliveryStatus}`;
    }
    return this.api.put<Order>(`/api/admin/orders/${orderId}/status${query}`, {});
  }

  // --- Admin Product CRUD ---
  addProduct(product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.api.post<Product>('/api/admin/products', product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.api.put<Product>(`/api/admin/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/api/admin/products/${id}`);
  }

  uploadProductImage(id: number, imageUrl: string): Observable<ApiResponse<Product>> {
    return this.api.post<Product>(`/api/admin/products/${id}/image?imageUrl=${encodeURIComponent(imageUrl)}`, {});
  }

  manageStock(id: number, stock: number): Observable<ApiResponse<Product>> {
    return this.api.put<Product>(`/api/admin/products/${id}/stock?stock=${stock}`, {});
  }

  // --- Admin Video CRUD ---
  addVideo(video: Partial<Video>): Observable<ApiResponse<Video>> {
    return this.api.post<Video>('/api/admin/self-care', video);
  }

  updateVideo(id: number, video: Partial<Video>): Observable<ApiResponse<Video>> {
    return this.api.put<Video>(`/api/admin/self-care/${id}`, video);
  }

  deleteVideo(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/api/admin/self-care/${id}`);
  }
}
