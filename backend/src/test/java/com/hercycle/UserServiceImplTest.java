package com.hercycle;

import com.hercycle.dto.request.RegisterRequest;
import com.hercycle.dto.response.UserResponse;
import com.hercycle.entity.Role;
import com.hercycle.entity.User;
import com.hercycle.exception.EmailAlreadyExistsException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.UserRepository;
import com.hercycle.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserServiceImpl class.
 */
@ExtendWith(MockitoExtension.class)
public class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EntityMapper entityMapper;

    @InjectMocks
    private UserServiceImpl userService;

    private RegisterRequest registerRequest;
    private User testUser;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setFirstName("Jane");
        registerRequest.setLastName("Doe");
        registerRequest.setEmail("jane@example.com");
        registerRequest.setPassword("securePassword");

        testUser = User.builder()
                .id(2L)
                .email("jane@example.com")
                .firstName("Jane")
                .lastName("Doe")
                .password("encodedPassword")
                .role(Role.ROLE_USER)
                .enabled(true)
                .build();

        userResponse = new UserResponse();
        userResponse.setId(2L);
        userResponse.setEmail("jane@example.com");
        userResponse.setFirstName("Jane");
    }

    @Test
    void testRegisterUser_Success() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(entityMapper.toUserResponse(any(User.class))).thenReturn(userResponse);

        UserResponse result = userService.register(registerRequest);

        assertNotNull(result);
        assertEquals("jane@example.com", result.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegisterUser_ThrowsEmailAlreadyExists() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> userService.register(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }
}
