package com.hercycle.exception;

/**
 * Custom exception thrown when a product is not found in the organic store.
 */
public class ProductNotFoundException extends ResourceNotFoundException {
    public ProductNotFoundException(String message) {
        super(message);
    }
}
