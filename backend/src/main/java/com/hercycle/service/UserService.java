package com.hercycle.service;

import com.hercycle.dto.request.*;
import com.hercycle.dto.response.*;
import com.hercycle.entity.User;

/**
 * Service interface for User registration, profile management, and authentication operations.
 */
public interface UserService {

    UserResponse register(RegisterRequest request);

    JwtResponse login(LoginRequest request);

    UserResponse getProfile();

    UserResponse updateProfile(UserProfileRequest request);

    void deleteProfile();

    void changePassword(ChangePasswordRequest request);

    String forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    JwtResponse refreshToken(RefreshTokenRequest request);

    User getLoggedInUser();
}
