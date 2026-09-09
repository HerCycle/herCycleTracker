import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData
} from '@angular/fire/firestore';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export interface CareProduct {
  id?: string;
  name: string;
  brand?: string;
  description?: string;
  imageUrl?: string;
  category: string;
  amazonUrl: string;
  flipkartUrl?: string;
  price?: number;
  active: boolean;
  displayOrder: number;
}

// Backward-compatibility aliases
export type RecommendedProduct = CareProduct;
export type Product = CareProduct;

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private readonly firestore = inject(Firestore);

  /**
   * Retrieves all care products directly from Firestore 'products' collection.
   * Uses direct collection read without server-side composite queries to prevent index errors.
   * Active filtering and displayOrder sorting are performed in TypeScript.
   */
  getProducts(): Observable<CareProduct[]> {
    console.log('SHOP SERVICE STARTED');
    try {
      const colRef = collection(this.firestore, 'products');

      return (collectionData(colRef, { idField: 'id' }) as Observable<CareProduct[]>).pipe(
        tap((raw) => {
          console.log('RAW PRODUCTS RECEIVED:', raw ? raw.length : 0);
        }),
        map((products) => {
          // Normalize and filter active products
          const active = (products || []).filter((p) => {
            // Check boolean true or string 'true'
            return p.active === true || (p.active as any) === 'true';
          });
          console.log('ACTIVE PRODUCTS:', active.length);

          const cats: Record<string, number> = {};
          active.forEach((p) => {
            cats[p.category] = (cats[p.category] || 0) + 1;
          });
          console.log('PRODUCT CATEGORIES:', cats);

          return active.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
        }),
        catchError((err) => {
          console.error('Organic Store Firestore error:', {
            code: err?.code,
            message: err?.message,
            name: err?.name,
            details: err
          });
          return throwError(() => err);
        })
      );
    } catch (err: any) {
      console.error('Organic Store Firestore initialization error:', {
        code: err?.code,
        message: err?.message,
        details: err
      });
      return throwError(() => err);
    }
  }

  /**
   * Retrieves active care products filtered by category.
   * If category is null, undefined, or 'ALL', all active products are returned.
   */
  getProductsByCategory(category: string): Observable<CareProduct[]> {
    return this.getProducts().pipe(
      map((products) => {
        if (!category || category === 'ALL') {
          return products;
        }
        return products.filter((p) => p.category === category);
      })
    );
  }
}
