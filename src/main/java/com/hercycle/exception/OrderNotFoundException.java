package com.hercycle.exception;

/**
 * Custom exception thrown when an order is not found.
 */
public class OrderNotFoundException extends ResourceNotFoundException {
    public OrderNotFoundException(String message) {
        super(message);
    }
}
