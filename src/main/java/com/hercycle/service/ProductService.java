package com.hercycle.service;

import com.hercycle.dto.request.ProductRequest;
import com.hercycle.dto.response.ProductResponse;
import org.springframework.data.domain.Page;

/**
 * Service interface for Organic Store product inventory.
 * Standardizes queries using Spring Data Page pagination wrappers.
 */
public interface ProductService {

    ProductResponse addProduct(ProductRequest request);

    ProductResponse updateProduct(Long id, ProductRequest request);

    void deleteProduct(Long id);

    Page<ProductResponse> viewProducts(int page, int size, String sortBy, String sortDir);

    Page<ProductResponse> searchProducts(String query, int page, int size, String sortBy, String sortDir);

    Page<ProductResponse> filterProducts(String category, int page, int size, String sortBy, String sortDir);

    ProductResponse viewProductDetails(Long id);

    ProductResponse updateImage(Long id, String imageUrl);

    ProductResponse manageStock(Long id, Integer stock);
}
