package com.hercycle.service;

import com.hercycle.dto.request.PartnerRequest;
import com.hercycle.dto.response.PartnerResponse;

/**
 * Service interface for partner connection invitations and approvals.
 */
public interface PartnerService {

    PartnerResponse invitePartner(PartnerRequest request);

    PartnerResponse acceptInvite();

    PartnerResponse rejectInvite();

    PartnerResponse viewPartner();

    void removePartner();
}
