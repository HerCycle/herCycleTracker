package com.hercycle.service.impl;

import com.hercycle.dto.request.PartnerRequest;
import com.hercycle.dto.response.PartnerResponse;
import com.hercycle.entity.Partner;
import com.hercycle.entity.PartnerStatus;
import com.hercycle.entity.User;
import com.hercycle.exception.BadRequestException;
import com.hercycle.exception.ResourceNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.PartnerRepository;
import com.hercycle.repository.UserRepository;
import com.hercycle.service.PartnerService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service implementation for Partner connections.
 */
@Service
@Transactional
public class PartnerServiceImpl implements PartnerService {

    private static final Logger logger = LoggerFactory.getLogger(PartnerServiceImpl.class);

    private final PartnerRepository partnerRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public PartnerServiceImpl(PartnerRepository partnerRepository, UserRepository userRepository,
                              UserService userService, EntityMapper entityMapper) {
        this.partnerRepository = partnerRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public PartnerResponse invitePartner(PartnerRequest request) {
        User user = userService.getLoggedInUser();
        logger.info("User {} inviting partner {}", user.getEmail(), request.getPartnerEmail());

        if (user.getEmail().equalsIgnoreCase(request.getPartnerEmail())) {
            throw new BadRequestException("You cannot invite yourself");
        }

        // Check if user already has an active or pending connection
        List<Partner> connections = partnerRepository.findByUserOrPartnerEmail(user, user.getEmail());
        boolean hasActiveConnection = connections.stream()
                .anyMatch(c -> c.getStatus() == PartnerStatus.ACCEPTED || c.getStatus() == PartnerStatus.PENDING);
        if (hasActiveConnection) {
            throw new BadRequestException("You already have a pending or active partner connection");
        }

        Partner partner = Partner.builder()
                .user(user)
                .partnerEmail(request.getPartnerEmail().toLowerCase())
                .status(PartnerStatus.PENDING)
                .build();

        user.setPartnerEmail(request.getPartnerEmail().toLowerCase());
        userRepository.save(user);

        Partner saved = partnerRepository.save(partner);
        return entityMapper.toPartnerResponse(saved);
    }

    @Override
    public PartnerResponse acceptInvite() {
        User user = userService.getLoggedInUser();
        logger.info("User {} accepting partner invitation", user.getEmail());

        Partner invitation = partnerRepository.findByPartnerEmail(user.getEmail())
                .filter(p -> p.getStatus() == PartnerStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("No pending partner invitation found for email: " + user.getEmail()));

        invitation.setStatus(PartnerStatus.ACCEPTED);
        invitation.setAcceptedDate(LocalDateTime.now());

        // Update current user's partner record
        user.setPartnerEmail(invitation.getUser().getEmail());
        userRepository.save(user);

        // Update inviting user's partner email mapping
        User invitingUser = invitation.getUser();
        invitingUser.setPartnerEmail(user.getEmail());
        userRepository.save(invitingUser);

        Partner saved = partnerRepository.save(invitation);
        return entityMapper.toPartnerResponse(saved);
    }

    @Override
    public PartnerResponse rejectInvite() {
        User user = userService.getLoggedInUser();
        logger.info("User {} rejecting partner invitation", user.getEmail());

        Partner invitation = partnerRepository.findByPartnerEmail(user.getEmail())
                .filter(p -> p.getStatus() == PartnerStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("No pending partner invitation found for email: " + user.getEmail()));

        invitation.setStatus(PartnerStatus.REJECTED);
        
        // Remove inviting user's partial reference
        User invitingUser = invitation.getUser();
        invitingUser.setPartnerEmail(null);
        userRepository.save(invitingUser);

        Partner saved = partnerRepository.save(invitation);
        return entityMapper.toPartnerResponse(saved);
    }

    @Override
    public PartnerResponse viewPartner() {
        User user = userService.getLoggedInUser();
        List<Partner> connections = partnerRepository.findByUserOrPartnerEmail(user, user.getEmail());
        Partner active = connections.stream()
                .filter(c -> c.getStatus() == PartnerStatus.ACCEPTED)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No active partner connection found"));

        return entityMapper.toPartnerResponse(active);
    }

    @Override
    public void removePartner() {
        User user = userService.getLoggedInUser();
        logger.info("User {} removing partner link", user.getEmail());

        List<Partner> connections = partnerRepository.findByUserOrPartnerEmail(user, user.getEmail());
        Partner active = connections.stream()
                .filter(c -> c.getStatus() == PartnerStatus.ACCEPTED)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No active partner connection found"));

        // Reset partner fields in user entities
        User userA = active.getUser();
        userA.setPartnerEmail(null);
        userRepository.save(userA);

        Optional<User> userB = userRepository.findByEmail(active.getPartnerEmail());
        if (userB.isPresent()) {
            userB.get().setPartnerEmail(null);
            userRepository.save(userB.get());
        }

        partnerRepository.delete(active);
    }
}
