import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { ShopService, CareProduct } from './shop.service';
import seedProducts from '../../../../scripts/seed-products.json';

describe('ShopService & Care Products Catalog', () => {
  let service: ShopService;

  const mockProducts: CareProduct[] = seedProducts as CareProduct[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ShopService,
        { provide: Firestore, useValue: {} }
      ]
    });
    service = TestBed.inject(ShopService);
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  describe('Product Catalog Integrity (22 Products & 5 Categories)', () => {
    it('should have exactly 22 products in total', () => {
      expect(mockProducts.length).toBe(22);
    });

    it('should have exactly 5 categories with correct counts', () => {
      const sanitaryPads = mockProducts.filter((p) => p.category === 'Sanitary Pads');
      const heatPads = mockProducts.filter((p) => p.category === 'Heat Pads');
      const periodPanties = mockProducts.filter((p) => p.category === 'Period Panties');
      const pantyLiners = mockProducts.filter((p) => p.category === 'Panty Liners');
      const essentialOils = mockProducts.filter((p) => p.category === 'Essential Oils');

      expect(sanitaryPads.length).toBe(5);
      expect(heatPads.length).toBe(5);
      expect(periodPanties.length).toBe(4);
      expect(pantyLiners.length).toBe(3);
      expect(essentialOils.length).toBe(5);
    });

    it('should enforce strict sequential displayOrder (1 to 22)', () => {
      const sorted = [...mockProducts].sort((a, b) => a.displayOrder - b.displayOrder);

      // Sanitary Pads: 1 to 5
      expect(sorted.slice(0, 5).map((p) => p.displayOrder)).toEqual([1, 2, 3, 4, 5]);
      expect(sorted.slice(0, 5).every((p) => p.category === 'Sanitary Pads')).toBeTrue();

      // Heat Pads: 6 to 10
      expect(sorted.slice(5, 10).map((p) => p.displayOrder)).toEqual([6, 7, 8, 9, 10]);
      expect(sorted.slice(5, 10).every((p) => p.category === 'Heat Pads')).toBeTrue();

      // Period Panties: 11 to 14
      expect(sorted.slice(10, 14).map((p) => p.displayOrder)).toEqual([11, 12, 13, 14]);
      expect(sorted.slice(10, 14).every((p) => p.category === 'Period Panties')).toBeTrue();

      // Panty Liners: 15 to 17
      expect(sorted.slice(14, 17).map((p) => p.displayOrder)).toEqual([15, 16, 17]);
      expect(sorted.slice(14, 17).every((p) => p.category === 'Panty Liners')).toBeTrue();

      // Essential Oils: 18 to 22
      expect(sorted.slice(17, 22).map((p) => p.displayOrder)).toEqual([18, 19, 20, 21, 22]);
      expect(sorted.slice(17, 22).every((p) => p.category === 'Essential Oils')).toBeTrue();
    });

    it('should preserve exact Amazon URLs without converting to search queries', () => {
      const exactUrls = [
        'https://amzn.in/d/0avR7i3q',
        'https://amzn.in/d/0bxI01aO',
        'https://amzn.in/d/0bTLHJRt',
        'https://amzn.in/d/0iyfCng7',
        'https://amzn.in/d/08n8PC9G',
        'https://amzn.in/d/0flJv4JA',
        'https://amzn.in/d/084MePhc',
        'https://amzn.in/d/05gcFVaq',
        'https://amzn.in/d/07Cv8zkL',
        'https://amzn.in/d/05cS4wcs',
        'https://amzn.in/d/08hdyVTe',
        'https://amzn.in/d/06da7LhP',
        'https://amzn.in/d/010Ytafv',
        'https://amzn.in/d/01CaIHsx',
        'https://amzn.in/d/06DrWTY4',
        'https://amzn.in/d/0fbFUMLZ',
        'https://amzn.in/d/00VqVIjU',
        'https://amzn.in/d/0adBs1R0',
        'https://amzn.in/d/0aL6xpkH',
        'https://amzn.in/d/0gQHrrP6',
        'https://amzn.in/d/03ZmfiTp',
        'https://amzn.in/d/0iJFEkKS'
      ];

      mockProducts.forEach((p, idx) => {
        expect(p.amazonUrl).toBe(exactUrls[idx]);
        expect(p.amazonUrl.startsWith('https://amzn.in/d/')).toBeTrue();
        expect(p.amazonUrl).not.toContain('/s?');
        expect(p.amazonUrl).not.toContain('s?k=');
      });
    });

    it('should have active: true for all products', () => {
      expect(mockProducts.every((p) => p.active === true)).toBeTrue();
    });

    it('should not contain fake rating, fake review, cart, or internal checkout fields', () => {
      mockProducts.forEach((p: any) => {
        expect(p.rating).toBeUndefined();
        expect(p.reviewsCount).toBeUndefined();
        expect(p.cart).toBeUndefined();
        expect(p.inventory).toBeUndefined();
        expect(p.stock).toBeUndefined();
        expect(p.quantity).toBeUndefined();
      });
    });
  });

  describe('Service Filtering Logic', () => {
    it('should return all products when category is ALL', (done) => {
      spyOn(service, 'getProducts').and.returnValue(of(mockProducts));

      service.getProductsByCategory('ALL').subscribe((products) => {
        expect(products.length).toBe(22);
        done();
      });
    });

    it('should filter correctly by specific category', (done) => {
      spyOn(service, 'getProducts').and.returnValue(of(mockProducts));

      service.getProductsByCategory('Period Panties').subscribe((products) => {
        expect(products.length).toBe(4);
        expect(products.every((p) => p.category === 'Period Panties')).toBeTrue();
        done();
      });
    });

    it('should filter correctly for Panty Liners', (done) => {
      spyOn(service, 'getProducts').and.returnValue(of(mockProducts));

      service.getProductsByCategory('Panty Liners').subscribe((products) => {
        expect(products.length).toBe(3);
        expect(products.every((p) => p.category === 'Panty Liners')).toBeTrue();
        done();
      });
    });
  });
});
