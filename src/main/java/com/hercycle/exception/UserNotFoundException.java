package com.hercycle.exception;

/**
 * Custom exception thrown when a user is not found.
 */
public class UserNotFoundException extends ResourceNotFoundException {
    public UserNotFoundException(String message) {
        super(message);
    }
}
