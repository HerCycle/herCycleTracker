package com.hercycle.service.impl;

import com.hercycle.dto.request.*;
import com.hercycle.dto.response.*;
import com.hercycle.entity.Role;
import com.hercycle.entity.User;
import com.hercycle.exception.BadRequestException;
import com.hercycle.exception.EmailAlreadyExistsException;
import com.hercycle.exception.UserNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.UserRepository;
import com.hercycle.security.JwtTokenProvider;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service implementation for User management and authorization rules.
 */
@Service
@Transactional
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;
    private final EntityMapper entityMapper;

    // Temporary storage for reset tokens in-memory
    private static final ConcurrentHashMap<String, String> resetTokens = new ConcurrentHashMap<>();

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider,
                           UserDetailsService userDetailsService, EntityMapper entityMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
        this.entityMapper = entityMapper;
    }

    @Override
    public UserResponse register(RegisterRequest request) {
        logger.info("Registering user: {}", request.getEmail());
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists: " + request.getEmail());
        }

        // Set ROLE_ADMIN if the email starts with "admin" for ease of bootstrap testing
        Role role = Role.ROLE_USER;
        if (request.getEmail().toLowerCase().startsWith("admin")) {
            role = Role.ROLE_ADMIN;
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .height(request.getHeight())
                .weight(request.getWeight())
                .bloodGroup(request.getBloodGroup())
                .pregnancyStatus(request.getPregnancyStatus())
                .notificationsEnabled(request.getNotificationsEnabled())
                .role(role)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        return entityMapper.toUserResponse(savedUser);
    }

    @Override
    public JwtResponse login(LoginRequest request) {
        logger.info("Authenticating user: {}", request.getEmail());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found: " + request.getEmail()));

        return JwtResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .build();
    }

    @Override
    public UserResponse getProfile() {
        User user = getLoggedInUser();
        return entityMapper.toUserResponse(user);
    }

    @Override
    public UserResponse updateProfile(UserProfileRequest request) {
        User user = getLoggedInUser();
        logger.info("Updating profile for: {}", user.getEmail());

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getHeight() != null) user.setHeight(request.getHeight());
        if (request.getWeight() != null) user.setWeight(request.getWeight());
        if (request.getBloodGroup() != null) user.setBloodGroup(request.getBloodGroup());
        if (request.getProfileImage() != null) user.setProfileImage(request.getProfileImage());
        if (request.getPregnancyStatus() != null) user.setPregnancyStatus(request.getPregnancyStatus());
        if (request.getNotificationsEnabled() != null) user.setNotificationsEnabled(request.getNotificationsEnabled());

        User updatedUser = userRepository.save(user);
        return entityMapper.toUserResponse(updatedUser);
    }

    @Override
    public void deleteProfile() {
        User user = getLoggedInUser();
        logger.info("Deleting profile for: {}", user.getEmail());
        userRepository.delete(user);
    }

    @Override
    public void changePassword(ChangePasswordRequest request) {
        User user = getLoggedInUser();
        logger.info("Changing password for: {}", user.getEmail());

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public String forgotPassword(ForgotPasswordRequest request) {
        logger.info("Forgot password requested for email: {}", request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));

        String token = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        resetTokens.put(request.getEmail(), token);
        logger.info("Password reset token generated: {} for user {}", token, request.getEmail());
        return token;
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        logger.info("Resetting password for email: {}", request.getEmail());
        String cachedToken = resetTokens.get(request.getEmail());
        if (cachedToken == null || !cachedToken.equals(request.getToken())) {
            throw new BadRequestException("Invalid reset token or email");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found: " + request.getEmail()));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        resetTokens.remove(request.getEmail());
    }

    @Override
    public JwtResponse refreshToken(RefreshTokenRequest request) {
        logger.info("Refreshing token");
        if (!jwtTokenProvider.validateToken(request.getRefreshToken())) {
            throw new BadRequestException("Invalid refresh token");
        }

        String username = jwtTokenProvider.getUsernameFromToken(request.getRefreshToken());
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        String newToken = jwtTokenProvider.generateToken(userDetails);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + username));

        return JwtResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .build();
    }

    @Override
    public User getLoggedInUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new BadRequestException("User is not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Authenticated user not found in database: " + email));
    }
}
