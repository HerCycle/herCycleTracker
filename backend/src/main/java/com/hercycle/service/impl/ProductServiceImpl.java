package com.hercycle.service.impl;

import com.hercycle.dto.request.ProductRequest;
import com.hercycle.dto.response.ProductResponse;
import com.hercycle.entity.Product;
import com.hercycle.exception.ResourceNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.ProductRepository;
import com.hercycle.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service implementation for Product management.
 */
@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductServiceImpl.class);

    private final ProductRepository productRepository;
    private final EntityMapper entityMapper;

    public ProductServiceImpl(ProductRepository productRepository, EntityMapper entityMapper) {
        this.productRepository = productRepository;
        this.entityMapper = entityMapper;
    }

    @Override
    public ProductResponse addProduct(ProductRequest request) {
        logger.info("Admin adding product: {}", request.getName());
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .discount(request.getDiscount())
                .stock(request.getStock())
                .brand(request.getBrand())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .build();

        Product saved = productRepository.save(product);
        return entityMapper.toProductResponse(saved);
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        logger.info("Admin updating product ID: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setDiscount(request.getDiscount());
        product.setStock(request.getStock());
        product.setBrand(request.getBrand());
        product.setCategory(request.getCategory());
        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl());
        }

        Product updated = productRepository.save(product);
        return entityMapper.toProductResponse(updated);
    }

    @Override
    public void deleteProduct(Long id) {
        logger.info("Admin deleting product ID: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        productRepository.delete(product);
    }

    @Override
    public Page<ProductResponse> viewProducts(int page, int size, String sortBy, String sortDir) {
        logger.info("Viewing paginated products: page={}, size={}, sortBy={}, sortDir={}", page, size, sortBy, sortDir);
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findAll(pageable).map(entityMapper::toProductResponse);
    }

    @Override
    public Page<ProductResponse> searchProducts(String query, int page, int size, String sortBy, String sortDir) {
        logger.info("Searching products for term '{}': page={}, size={}, sortBy={}, sortDir={}", query, page, size, sortBy, sortDir);
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrBrandContainingIgnoreCase(
                query, query, query, pageable).map(entityMapper::toProductResponse);
    }

    @Override
    public Page<ProductResponse> filterProducts(String category, int page, int size, String sortBy, String sortDir) {
        logger.info("Filtering products for category '{}': page={}, size={}, sortBy={}, sortDir={}", category, page, size, sortBy, sortDir);
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findByCategoryIgnoreCase(category, pageable).map(entityMapper::toProductResponse);
    }

    @Override
    public ProductResponse viewProductDetails(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        return entityMapper.toProductResponse(product);
    }

    @Override
    public ProductResponse updateImage(Long id, String imageUrl) {
        logger.info("Updating product image for ID: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        product.setImageUrl(imageUrl);
        Product saved = productRepository.save(product);
        return entityMapper.toProductResponse(saved);
    }

    @Override
    public ProductResponse manageStock(Long id, Integer stock) {
        logger.info("Updating product stock to {} for ID: {}", stock, id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        product.setStock(stock);
        Product saved = productRepository.save(product);
        return entityMapper.toProductResponse(saved);
    }
}
