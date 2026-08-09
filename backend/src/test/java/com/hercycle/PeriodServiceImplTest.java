package com.hercycle;

import com.hercycle.dto.request.PeriodRequest;
import com.hercycle.dto.response.PeriodResponse;
import com.hercycle.entity.Flow;
import com.hercycle.entity.PeriodTracker;
import com.hercycle.entity.Role;
import com.hercycle.entity.User;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.PeriodTrackerRepository;
import com.hercycle.service.impl.PeriodServiceImpl;
import com.hercycle.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PeriodServiceImpl class.
 */
@ExtendWith(MockitoExtension.class)
public class PeriodServiceImplTest {

    @Mock
    private PeriodTrackerRepository periodRepository;

    @Mock
    private UserService userService;

    @Mock
    private EntityMapper entityMapper;

    @InjectMocks
    private PeriodServiceImpl periodService;

    private User testUser;
    private PeriodTracker p1;
    private PeriodTracker p2;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@hercycle.com")
                .firstName("Alice")
                .lastName("Smith")
                .role(Role.ROLE_USER)
                .enabled(true)
                .build();

        p1 = PeriodTracker.builder()
                .id(10L)
                .user(testUser)
                .periodStartDate(LocalDate.now().minusDays(28))
                .periodEndDate(LocalDate.now().minusDays(24))
                .flow(Flow.MEDIUM)
                .build();

        p2 = PeriodTracker.builder()
                .id(11L)
                .user(testUser)
                .periodStartDate(LocalDate.now().minusDays(56))
                .periodEndDate(LocalDate.now().minusDays(52))
                .flow(Flow.HEAVY)
                .build();
    }

    @Test
    void testSavePeriod() {
        when(userService.getLoggedInUser()).thenReturn(testUser);
        
        PeriodRequest request = new PeriodRequest();
        request.setPeriodStartDate(LocalDate.now());
        request.setFlow("MEDIUM");

        PeriodResponse response = new PeriodResponse();
        response.setId(12L);
        response.setPeriodStartDate(LocalDate.now());

        when(periodRepository.save(any(PeriodTracker.class))).thenReturn(p1);
        when(entityMapper.toPeriodResponse(any(PeriodTracker.class))).thenReturn(response);

        PeriodResponse result = periodService.savePeriod(request);

        assertNotNull(result);
        assertEquals(12L, result.getId());
        verify(periodRepository, times(1)).save(any(PeriodTracker.class));
    }

    @Test
    void testGetCycleRegularityScore() {
        when(userService.getLoggedInUser()).thenReturn(testUser);
        
        List<PeriodTracker> list = new ArrayList<>();
        list.add(p1);
        list.add(p2);
        PeriodTracker p3 = PeriodTracker.builder()
                .id(12L)
                .user(testUser)
                .periodStartDate(LocalDate.now().minusDays(84))
                .build();
        list.add(p3);

        when(periodRepository.findByUserOrderByPeriodStartDateDesc(testUser)).thenReturn(list);

        Double score = periodService.getCycleRegularityScore();
        assertNotNull(score);
        assertTrue(score >= 0 && score <= 100);
    }
}
