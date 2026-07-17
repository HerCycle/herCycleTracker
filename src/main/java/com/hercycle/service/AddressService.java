package com.hercycle.service;

import com.hercycle.dto.request.AddressRequest;
import com.hercycle.dto.response.AddressResponse;

import java.util.List;

/**
 * Service interface for delivery address CRUD operations.
 */
public interface AddressService {

    AddressResponse addAddress(AddressRequest request);

    AddressResponse updateAddress(Long id, AddressRequest request);

    void deleteAddress(Long id);

    List<AddressResponse> listAddresses();

    AddressResponse getAddressById(Long id);
}
