package com.hercycle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for authentication success payload containing JWT details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JwtResponse {

    private String token;

    private String refreshToken;

    private String email;

    private String firstName;

    private String lastName;

    private String role;
}
