package com.hercycle.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO response representing user details.
 */
@Data
public class UserResponse {

    private Long id;

    private String firstName;

    private String lastName;

    private String email;

    private String phone;

    private LocalDate dateOfBirth;

    private Integer age;

    private Double height;

    private Double weight;

    private String bloodGroup;

    private String profileImage;

    private String partnerEmail;

    private Boolean pregnancyStatus;

    private Boolean notificationsEnabled;

    private String role;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
