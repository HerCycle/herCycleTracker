package com.hercycle.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO request payload to request new access tokens.
 */
@Data
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}
