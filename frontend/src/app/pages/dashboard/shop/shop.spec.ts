import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ShopPage } from './shop';
import { ShopService, CareProduct } from '../../../services/shop.service';
import seedProducts from '../../../../../../scripts/seed-products.json';

describe('ShopPage (Organic Store UI)', () => {
  let component: ShopPage;
  let fixture: ComponentFixture<ShopPage>;
  let mockShopService: jasmine.SpyObj<ShopService>;

  const testProducts: CareProduct[] = seedProducts as CareProduct[];

  beforeEach(async () => {
    mockShopService = jasmine.createSpyObj('ShopService', ['getProducts']);
    mockShopService.getProducts.and.returnValue(of(testProducts));

    await TestBed.configureTestingModule({
      imports: [ShopPage],
      providers: [
        { provide: ShopService, useValue: mockShopService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShopPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the Organic Store component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 22 products loaded and category set to ALL', () => {
    expect(component.allProducts().length).toBe(22);
    expect(component.selectedCategory()).toBe('ALL');
    expect(component.filteredProducts().length).toBe(22);
    expect(component.isLoading()).toBeFalse();
  });

  it('should render exact 5 categories in navigation filter tabs', () => {
    const expectedCategories = [
      'All',
      'Sanitary Pads',
      'Heat Pads',
      'Period Panties',
      'Panty Liners',
      'Essential Oils'
    ];
    expect(component.categories.map((c) => c.label)).toEqual(expectedCategories);
  });

  it('should filter correctly when selecting Sanitary Pads', () => {
    component.setCategory('Sanitary Pads');
    expect(component.filteredProducts().length).toBe(5);
    expect(component.filteredProducts().every((p) => p.category === 'Sanitary Pads')).toBeTrue();
  });

  it('should filter correctly when selecting Heat Pads', () => {
    component.setCategory('Heat Pads');
    expect(component.filteredProducts().length).toBe(5);
    expect(component.filteredProducts().every((p) => p.category === 'Heat Pads')).toBeTrue();
  });

  it('should filter correctly when selecting Period Panties', () => {
    component.setCategory('Period Panties');
    expect(component.filteredProducts().length).toBe(4);
    expect(component.filteredProducts().every((p) => p.category === 'Period Panties')).toBeTrue();
  });

  it('should filter correctly when selecting Panty Liners', () => {
    component.setCategory('Panty Liners');
    expect(component.filteredProducts().length).toBe(3);
    expect(component.filteredProducts().every((p) => p.category === 'Panty Liners')).toBeTrue();
  });

  it('should filter correctly when selecting Essential Oils', () => {
    component.setCategory('Essential Oils');
    expect(component.filteredProducts().length).toBe(5);
    expect(component.filteredProducts().every((p) => p.category === 'Essential Oils')).toBeTrue();
  });

  it('should combine category filtering with keyword search seamlessly', () => {
    // Select Period Panties and search for "cotton"
    component.setCategory('Period Panties');
    component.searchQuery.set('cotton');

    const matches = component.filteredProducts();
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((p) => p.category === 'Period Panties')).toBeTrue();
    expect(
      matches.every(
        (p) =>
          p.name.toLowerCase().includes('cotton') ||
          (p.description && p.description.toLowerCase().includes('cotton'))
      )
    ).toBeTrue();
  });

  it('should reset all filters when resetFilters() is called', () => {
    component.setCategory('Heat Pads');
    component.searchQuery.set('electric');
    expect(component.filteredProducts().length).toBeLessThan(22);

    component.resetFilters();
    expect(component.selectedCategory()).toBe('ALL');
    expect(component.searchQuery()).toBe('');
    expect(component.filteredProducts().length).toBe(22);
  });

  it('should track image error fallback', () => {
    expect(component.isImageFailed('prod-01')).toBeFalse();
    component.onImageError('prod-01');
    expect(component.isImageFailed('prod-01')).toBeTrue();
  });

  it('should have Buy on Amazon links opening in new tab with noopener noreferrer', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const amazonLinks = compiled.querySelectorAll<HTMLAnchorElement>('.btn-amazon');

    expect(amazonLinks.length).toBe(22);
    amazonLinks.forEach((link) => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.getAttribute('href')).toMatch(/^https:\/\/amzn\.in\/d\//);
      expect(link.textContent).toContain('Buy on Amazon');
    });
  });

  it('should not render any cart, checkout, order, or fake rating elements', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.btn-cart')).toBeNull();
    expect(compiled.querySelector('.cart-icon')).toBeNull();
    expect(compiled.querySelector('.checkout-btn')).toBeNull();
    expect(compiled.querySelector('.star-rating')).toBeNull();
    expect(compiled.querySelector('.rating-badge')).toBeNull();
  });
});
