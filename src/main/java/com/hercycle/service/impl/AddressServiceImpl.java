package com.hercycle.service.impl;

import com.hercycle.dto.request.AddressRequest;
import com.hercycle.dto.response.AddressResponse;
import com.hercycle.entity.Address;
import com.hercycle.entity.User;
import com.hercycle.exception.BadRequestException;
import com.hercycle.exception.ResourceNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.AddressRepository;
import com.hercycle.service.AddressService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for Address.
 */
@Service
@Transactional
public class AddressServiceImpl implements AddressService {

    private static final Logger logger = LoggerFactory.getLogger(AddressServiceImpl.class);

    private final AddressRepository addressRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public AddressServiceImpl(AddressRepository addressRepository, UserService userService, EntityMapper entityMapper) {
        this.addressRepository = addressRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public AddressResponse addAddress(AddressRequest request) {
        User user = userService.getLoggedInUser();
        logger.info("Adding address for user {}", user.getEmail());

        if (Boolean.TRUE.equals(request.getDefaultAddress())) {
            resetDefaultAddress(user);
        }

        Address address = Address.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .houseNo(request.getHouseNo())
                .street(request.getStreet())
                .city(request.getCity())
                .district(request.getDistrict())
                .state(request.getState())
                .country(request.getCountry())
                .postalCode(request.getPostalCode())
                .defaultAddress(request.getDefaultAddress() != null ? request.getDefaultAddress() : false)
                .build();

        Address saved = addressRepository.save(address);
        return entityMapper.toAddressResponse(saved);
    }

    @Override
    public AddressResponse updateAddress(Long id, AddressRequest request) {
        User user = userService.getLoggedInUser();
        logger.info("Updating address ID {} for user {}", id, user.getEmail());

        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with ID: " + id));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to address details");
        }

        if (Boolean.TRUE.equals(request.getDefaultAddress())) {
            resetDefaultAddress(user);
        }

        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setHouseNo(request.getHouseNo());
        address.setStreet(request.getStreet());
        address.setCity(request.getCity());
        address.setDistrict(request.getDistrict());
        address.setState(request.getState());
        address.setCountry(request.getCountry());
        address.setPostalCode(request.getPostalCode());
        address.setDefaultAddress(request.getDefaultAddress() != null ? request.getDefaultAddress() : false);

        Address updated = addressRepository.save(address);
        return entityMapper.toAddressResponse(updated);
    }

    @Override
    public void deleteAddress(Long id) {
        User user = userService.getLoggedInUser();
        logger.info("Deleting address ID {} for user {}", id, user.getEmail());

        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with ID: " + id));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to address details");
        }

        addressRepository.delete(address);
    }

    @Override
    public List<AddressResponse> listAddresses() {
        User user = userService.getLoggedInUser();
        return addressRepository.findByUser(user).stream()
                .map(entityMapper::toAddressResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AddressResponse getAddressById(Long id) {
        User user = userService.getLoggedInUser();
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with ID: " + id));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to address details");
        }
        return entityMapper.toAddressResponse(address);
    }

    private void resetDefaultAddress(User user) {
        List<Address> addresses = addressRepository.findByUser(user);
        for (Address ad : addresses) {
            if (Boolean.TRUE.equals(ad.getDefaultAddress())) {
                ad.setDefaultAddress(false);
                addressRepository.save(ad);
            }
        }
    }
}
