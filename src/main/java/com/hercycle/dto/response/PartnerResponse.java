package com.hercycle.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO response representing partner status.
 */
@Data
public class PartnerResponse {

    private Long id;

    private String partnerEmail;

    private String status;

    private LocalDateTime inviteDate;

    private LocalDateTime acceptedDate;
}
