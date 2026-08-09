package com.hercycle.dto.request;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO request payload to update user profile.
 */
@Data
public class UserProfileRequest {

    private String firstName;

    private String lastName;

    @Pattern(regexp = "^$|[0-9]{10,15}$", message = "Phone must be valid number of 10 to 15 digits")
    private String phone;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    private Double height;

    private Double weight;

    @Pattern(regexp = "^$|^(A|B|AB|O)[+-]$", message = "Blood group must be valid, e.g. O+, A-")
    private String bloodGroup;

    private String profileImage;

    private Boolean pregnancyStatus;

    private Boolean notificationsEnabled;
}
