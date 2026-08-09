package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * User Entity representing the "users" table.
 * Extends Auditable to inherit system logging fields.
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email", unique = true)
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "phone")
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "age")
    private Integer age;

    @Column(name = "height")
    private Double height;

    @Column(name = "weight")
    private Double weight;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Column(name = "profile_image")
    private String profileImage;

    @Column(name = "partner_email")
    private String partnerEmail;

    @Column(name = "pregnancy_status")
    private Boolean pregnancyStatus;

    @Column(name = "notifications_enabled")
    private Boolean notificationsEnabled;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @PrePersist
    protected void onUserCreate() {
        this.enabled = this.enabled != null ? this.enabled : true;
        this.pregnancyStatus = this.pregnancyStatus != null ? this.pregnancyStatus : false;
        this.notificationsEnabled = this.notificationsEnabled != null ? this.notificationsEnabled : true;
        this.role = this.role != null ? this.role : Role.ROLE_USER;
        
        // Auto-calculate age
        if (this.dateOfBirth != null) {
            this.age = LocalDate.now().getYear() - this.dateOfBirth.getYear();
        }
    }

    @PreUpdate
    protected void onUserUpdate() {
        if (this.dateOfBirth != null) {
            this.age = LocalDate.now().getYear() - this.dateOfBirth.getYear();
        }
    }
}
