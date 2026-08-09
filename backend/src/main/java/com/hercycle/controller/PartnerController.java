package com.hercycle.controller;

import com.hercycle.dto.ApiResponse;
import com.hercycle.dto.request.PartnerRequest;
import com.hercycle.dto.response.PartnerResponse;
import com.hercycle.service.PartnerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Partner connection invitations and log sharing.
 */
@RestController
@RequestMapping("/api/partner")
public class PartnerController {

    private final PartnerService partnerService;

    public PartnerController(PartnerService partnerService) {
        this.partnerService = partnerService;
    }

    @PostMapping("/invite")
    public ResponseEntity<ApiResponse<PartnerResponse>> invitePartner(@Valid @RequestBody PartnerRequest request) {
        PartnerResponse response = partnerService.invitePartner(request);
        return ResponseEntity.ok(ApiResponse.success("Invitation sent successfully", response));
    }

    @PutMapping("/accept")
    public ResponseEntity<ApiResponse<PartnerResponse>> acceptInvite() {
        PartnerResponse response = partnerService.acceptInvite();
        return ResponseEntity.ok(ApiResponse.success("Invitation accepted successfully", response));
    }

    @PutMapping("/reject")
    public ResponseEntity<ApiResponse<PartnerResponse>> rejectInvite() {
        PartnerResponse response = partnerService.rejectInvite();
        return ResponseEntity.ok(ApiResponse.success("Invitation rejected successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PartnerResponse>> viewPartner() {
        PartnerResponse response = partnerService.viewPartner();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> removePartner() {
        partnerService.removePartner();
        return ResponseEntity.ok(ApiResponse.success("Partner connection removed successfully"));
    }
}
