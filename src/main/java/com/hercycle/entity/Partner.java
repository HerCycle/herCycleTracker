package com.hercycle.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Partner Entity representing partner invitations and status.
 * Extends Auditable.
 */
@Entity
@Table(name = "partners", indexes = {
    @Index(name = "idx_partner_email", columnList = "partner_email"),
    @Index(name = "idx_partner_user", columnList = "user_id")
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Partner extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "partner_email", nullable = false)
    private String partnerEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PartnerStatus status;

    @Column(name = "invite_date", nullable = false)
    private LocalDateTime inviteDate;

    @Column(name = "accepted_date")
    private LocalDateTime acceptedDate;

    @PrePersist
    protected void onPartnerCreate() {
        this.inviteDate = LocalDateTime.now();
        this.status = this.status != null ? this.status : PartnerStatus.PENDING;
    }
}
