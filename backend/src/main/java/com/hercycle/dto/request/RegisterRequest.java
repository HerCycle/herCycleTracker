package com.hercycle.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO request payload for user registration.
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters long")
    private String password;

    @Pattern(regexp = "^$|[0-9]{10,15}$", message = "Phone must be valid number of 10 to 15 digits")
    private String phone;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @Min(value = 30, message = "Height must be at least 30 cm")
    private Double height;

    @Min(value = 5, message = "Weight must be at least 5 kg")
    private Double weight;

    @Pattern(regexp = "^$|^(A|B|AB|O)[+-]$", message = "Blood group must be valid, e.g. O+, A-")
    private String bloodGroup;

    private Boolean pregnancyStatus;

    private Boolean notificationsEnabled;
}
