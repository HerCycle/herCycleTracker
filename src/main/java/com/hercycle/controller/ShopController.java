package com.hercycle.controller;

import com.hercycle.dto.ApiResponse;
import com.hercycle.dto.request.AddressRequest;
import com.hercycle.dto.request.CartRequest;
import com.hercycle.dto.request.ProductRequest;
import com.hercycle.dto.response.*;
import com.hercycle.service.AddressService;
import com.hercycle.service.CartService;
import com.hercycle.service.ProductService;
import com.hercycle.service.WishlistService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Consolidated REST Controller for Organic Store items, Shopping Cart, Wishlists, and Addresses.
 * Product listings are fully paginated and sorted.
 */
@RestController
@RequestMapping("/api")
public class ShopController {

    private final ProductService productService;
    private final CartService cartService;
    private final WishlistService wishlistService;
    private final AddressService addressService;

    public ShopController(ProductService productService, CartService cartService,
                          WishlistService wishlistService, AddressService addressService) {
        this.productService = productService;
        this.cartService = cartService;
        this.wishlistService = wishlistService;
        this.addressService = addressService;
    }

    // ==========================================
    // ORGANIC STORE: USER PRODUCTS APIs (PAGINATED)
    // ==========================================

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> viewProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Page<ProductResponse> response = productService.viewProducts(page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/search")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Page<ProductResponse> response = productService.searchProducts(query, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/filter")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> filterProducts(
            @RequestParam String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Page<ProductResponse> response = productService.filterProducts(category, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> viewProductDetails(@PathVariable Long id) {
        ProductResponse response = productService.viewProductDetails(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ==========================================
    // ORGANIC STORE: ADMIN PRODUCTS APIs
    // ==========================================

    @PostMapping("/admin/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> addProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.addProduct(request);
        return ResponseEntity.ok(ApiResponse.success("Product added successfully by Admin", response));
    }

    @PutMapping("/admin/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully by Admin", response));
    }

    @DeleteMapping("/admin/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully by Admin"));
    }

    @PostMapping("/admin/products/{id}/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> uploadProductImage(@PathVariable Long id, @RequestParam String imageUrl) {
        ProductResponse response = productService.updateImage(id, imageUrl);
        return ResponseEntity.ok(ApiResponse.success("Product image link updated successfully", response));
    }

    @PutMapping("/admin/products/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> manageStock(@PathVariable Long id, @RequestParam Integer stock) {
        ProductResponse response = productService.manageStock(id, stock);
        return ResponseEntity.ok(ApiResponse.success("Product stock updated successfully by Admin", response));
    }

    // ==========================================
    // SHOPPING CART APIs
    // ==========================================

    @PostMapping("/cart")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(@Valid @RequestBody CartRequest request) {
        CartResponse response = cartService.addToCart(request);
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", response));
    }

    @PutMapping("/cart/{id}")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartQuantity(@PathVariable Long id, @RequestParam Integer quantity) {
        CartResponse response = cartService.updateQuantity(id, quantity);
        return ResponseEntity.ok(ApiResponse.success("Cart quantity updated", response));
    }

    @DeleteMapping("/cart/{id}")
    public ResponseEntity<ApiResponse<CartResponse>> removeCartItem(@PathVariable Long id) {
        CartResponse response = cartService.removeItem(id);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", response));
    }

    @DeleteMapping("/cart")
    public ResponseEntity<ApiResponse<Void>> clearCart() {
        cartService.clearCart();
        return ResponseEntity.ok(ApiResponse.success("Cart cleared successfully"));
    }

    @GetMapping("/cart")
    public ResponseEntity<ApiResponse<CartResponse>> viewCart() {
        CartResponse response = cartService.viewCart();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ==========================================
    // USER WISHLIST APIs
    // ==========================================

    @PostMapping("/wishlist")
    public ResponseEntity<ApiResponse<WishlistResponse>> addToWishlist(@RequestParam Long productId) {
        WishlistResponse response = wishlistService.addToWishlist(productId);
        return ResponseEntity.ok(ApiResponse.success("Added to wishlist", response));
    }

    @DeleteMapping("/wishlist/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(@PathVariable Long productId) {
        wishlistService.removeFromWishlist(productId);
        return ResponseEntity.ok(ApiResponse.success("Removed from wishlist"));
    }

    @GetMapping("/wishlist")
    public ResponseEntity<ApiResponse<List<WishlistResponse>>> viewWishlist() {
        List<WishlistResponse> response = wishlistService.viewWishlist();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ==========================================
    // USER ADDRESSES APIs
    // ==========================================

    @PostMapping("/addresses")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(@Valid @RequestBody AddressRequest request) {
        AddressResponse response = addressService.addAddress(request);
        return ResponseEntity.ok(ApiResponse.success("Address added successfully", response));
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(@PathVariable Long id, @Valid @RequestBody AddressRequest request) {
        AddressResponse response = addressService.updateAddress(id, request);
        return ResponseEntity.ok(ApiResponse.success("Address updated successfully", response));
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(@PathVariable Long id) {
        addressService.deleteAddress(id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully"));
    }

    @GetMapping("/addresses")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> listAddresses() {
        List<AddressResponse> response = addressService.listAddresses();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
