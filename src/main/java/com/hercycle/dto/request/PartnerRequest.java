package com.hercycle.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO request payload to send a partner invitation.
 */
@Data
public class PartnerRequest {

    @NotBlank(message = "Partner email is required")
    @Email(message = "Partner email must be valid")
    private String partnerEmail;
}
