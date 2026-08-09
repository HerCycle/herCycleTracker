package com.hercycle.dto.response;

import lombok.Data;

/**
 * DTO response representing user address details.
 */
@Data
public class AddressResponse {

    private Long id;

    private String fullName;

    private String phone;

    private String houseNo;

    private String street;

    private String city;

    private String district;

    private String state;

    private String country;

    private String postalCode;

    private Boolean defaultAddress;
}
