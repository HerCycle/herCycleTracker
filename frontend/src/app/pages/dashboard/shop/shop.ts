import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService, CareProduct } from '../../../services/shop.service';

export interface CategoryOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shop.html',
  styleUrl: './shop.scss'
})
export class ShopPage implements OnInit {
  private readonly shopService = inject(ShopService);

  readonly allProducts = signal<CareProduct[]>([]);
  readonly selectedCategory = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly categories: CategoryOption[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Sanitary Pads', value: 'Sanitary Pads' },
    { label: 'Heat Pads', value: 'Heat Pads' },
    { label: 'Period Panties', value: 'Period Panties' },
    { label: 'Panty Liners', value: 'Panty Liners' },
    { label: 'Essential Oils', value: 'Essential Oils' }
  ];

  // Combined Category Filter + Multi-Field Search
  readonly filteredProducts = computed(() => {
    let list = this.allProducts();
    const currentCat = this.selectedCategory();

    if (currentCat && currentCat !== 'ALL') {
      list = list.filter((p) => (p.category || '').trim() === currentCat.trim());
    }

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return (
          name.includes(query) ||
          brand.includes(query) ||
          desc.includes(query) ||
          cat.includes(query)
        );
      });
    }

    return list;
  });

  // Track failed images to display neutral placeholder
  readonly failedImages = signal<Set<string>>(new Set<string>());

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.shopService.getProducts().subscribe({
      next: (products) => {
        console.log('SHOP COMPONENT PRODUCTS:', products);
        this.allProducts.set(products);
        this.isLoading.set(false);
        console.log('SHOP ALL PRODUCTS COUNT:', this.allProducts().length);
        console.log('SHOP FILTERED PRODUCTS COUNT:', this.filteredProducts().length);
      },
      error: (err) => {
        console.error('SHOP COMPONENT FIRESTORE ERROR:', err);
        this.errorMessage.set(
          err?.message || 'Unable to load care products. Please check your connection and try again.'
        );
        this.isLoading.set(false);
      }
    });
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    console.log('SELECTED CATEGORY:', category, 'FILTERED COUNT:', this.filteredProducts().length);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  resetFilters(): void {
    this.selectedCategory.set('ALL');
    this.searchQuery.set('');
  }

  onImageError(key: string | undefined): void {
    if (key) {
      const set = new Set(this.failedImages());
      set.add(key);
      this.failedImages.set(set);
    }
  }

  isImageFailed(key: string | undefined): boolean {
    return key ? this.failedImages().has(key) : false;
  }
}
