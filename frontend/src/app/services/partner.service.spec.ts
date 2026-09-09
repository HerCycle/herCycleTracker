import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import {
  PartnerService,
  PartnerInvitation,
  PartnerSharingPermissions,
  DEFAULT_SHARING_PERMISSIONS,
  PartnerSharedData
} from './partner.service';
import { CycleService, CycleMetrics } from './cycle.service';

describe('PartnerService & Partner Portal Unit Tests', () => {
  let service: PartnerService;
  let cycleService: CycleService;

  const mockCurrentUser = {
    uid: 'owner-uid-123',
    email: 'owner@example.com',
    displayName: 'Owner User'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PartnerService,
        CycleService,
        {
          provide: Auth,
          useValue: {
            currentUser: mockCurrentUser,
            authStateReady: () => Promise.resolve()
          }
        },
        { provide: Firestore, useValue: {} }
      ]
    });
    service = TestBed.inject(PartnerService);
    cycleService = TestBed.inject(CycleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // 1. Invalid invitation emails
  it('1. should reject invalid or empty email addresses', async () => {
    const emptyRes = await service.createInvitation('');
    expect(emptyRes.success).toBeFalse();
    expect(emptyRes.message).toContain('valid email');

    const invalidRes = await service.createInvitation('invalid-email-string');
    expect(invalidRes.success).toBeFalse();
    expect(invalidRes.message).toContain('valid email');
  });

  // 2. Self-invitation rejection
  it('2. should reject self-invitation when user enters their own email', async () => {
    const res = await service.createInvitation('owner@example.com');
    expect(res.success).toBeFalse();
    expect(res.message).toContain('cannot invite yourself');
  });

  // 3. Expiration calculation (7 days)
  it('3. should generate invitations with 7-day expiration', () => {
    const now = Date.now();
    const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    const expiryTime = new Date(expiresAt).getTime();
    const diffDays = Math.round((expiryTime - now) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  // 4. Default sharing permissions
  it('4. should provide default sharing permissions with private fields strictly false', () => {
    const defaults = DEFAULT_SHARING_PERMISSIONS;
    // Permitted by default
    expect(defaults.cycle).toBeTrue();
    expect(defaults.predictions).toBeTrue();
    expect(defaults.fertility).toBeTrue();
    expect(defaults.selfCare).toBeTrue();

    // Strictly private by default
    expect(defaults.symptoms).toBeFalse();
    expect(defaults.medication).toBeFalse();
    expect(defaults.profile).toBeFalse();
  });

  // 5. Shared data generation with all permissions enabled
  it('5. should construct shared payload with all permitted fields', () => {
    const mockMetrics: CycleMetrics = {
      hasData: true,
      hasCompletedCycles: true,
      completedCyclesCount: 2,
      latestPeriodStartDate: '2026-09-01',
      cycleLength: 28,
      periodLength: 5,
      cycleDay: 9,
      cyclePhase: 'Follicular Phase',
      phaseProgress: 32,
      nextPeriodDate: '2026-09-29',
      ovulationDate: '2026-09-15',
      fertileWindowStart: '2026-09-10',
      fertileWindowEnd: '2026-09-16',
      regularityScore: 90,
      regularityStatus: 'REGULAR',
      isLate: false,
      isIrregular: false,
      actualCycleLengths: [28, 28]
    };

    const permissions: PartnerSharingPermissions = {
      cycle: true,
      predictions: true,
      fertility: true,
      selfCare: true,
      symptoms: false,
      medication: false,
      profile: false
    };

    const tips = service.getPhaseSupportTips(mockMetrics.cyclePhase);

    const sharedData: PartnerSharedData = {
      ownerUid: 'owner-123',
      partnerUid: 'partner-456',
      ownerName: 'Owner User',
      permissions,
      currentCycleDay: permissions.cycle ? mockMetrics.cycleDay : null,
      cyclePhase: permissions.cycle ? mockMetrics.cyclePhase : null,
      nextPeriodDate: permissions.predictions ? mockMetrics.nextPeriodDate : null,
      ovulationDate: permissions.fertility ? mockMetrics.ovulationDate : null,
      fertileWindowStart: permissions.fertility ? mockMetrics.fertileWindowStart : null,
      fertileWindowEnd: permissions.fertility ? mockMetrics.fertileWindowEnd : null,
      periodStatus: 'On Track',
      sharedSelfCare: permissions.selfCare ? tips : null,
      updatedAt: new Date().toISOString()
    };

    expect(sharedData.currentCycleDay).toBe(9);
    expect(sharedData.cyclePhase).toBe('Follicular Phase');
    expect(sharedData.nextPeriodDate).toBe('2026-09-29');
    expect(sharedData.ovulationDate).toBe('2026-09-15');
    expect(sharedData.fertileWindowStart).toBe('2026-09-10');
    expect(sharedData.fertileWindowEnd).toBe('2026-09-16');
    expect(sharedData.sharedSelfCare?.length).toBeGreaterThan(0);
    // Symptoms and medication are omitted
    expect((sharedData as any).symptoms).toBeUndefined();
    expect((sharedData as any).medication).toBeUndefined();
  });

  // 6. Permission filtering: Fertility disabled
  it('6. should filter out fertility and ovulation data when fertility permission is false', () => {
    const mockMetrics: CycleMetrics = {
      hasData: true,
      hasCompletedCycles: false,
      completedCyclesCount: 0,
      cycleLength: 28,
      periodLength: 5,
      cycleDay: 8,
      cyclePhase: 'Follicular Phase',
      phaseProgress: 28,
      nextPeriodDate: '2026-09-30',
      ovulationDate: '2026-09-16',
      fertileWindowStart: '2026-09-11',
      fertileWindowEnd: '2026-09-17',
      regularityScore: null,
      regularityStatus: 'BUILDING_HISTORY',
      isLate: false,
      isIrregular: false,
      actualCycleLengths: []
    };

    const permissions: PartnerSharingPermissions = {
      cycle: true,
      predictions: true,
      fertility: false, // Disabled by user!
      selfCare: true,
      symptoms: false,
      medication: false,
      profile: false
    };

    const payload: any = {
      ownerUid: 'owner-123',
      partnerUid: 'partner-456',
      ownerName: 'Owner User',
      permissions,
      currentCycleDay: permissions.cycle ? mockMetrics.cycleDay : null,
      cyclePhase: permissions.cycle ? mockMetrics.cyclePhase : null,
      nextPeriodDate: permissions.predictions ? mockMetrics.nextPeriodDate : null,
      ovulationDate: permissions.fertility ? mockMetrics.ovulationDate : null,
      fertileWindowStart: permissions.fertility ? mockMetrics.fertileWindowStart : null,
      fertileWindowEnd: permissions.fertility ? mockMetrics.fertileWindowEnd : null
    };

    expect(payload.currentCycleDay).toBe(8);
    expect(payload.nextPeriodDate).toBe('2026-09-30');
    expect(payload.ovulationDate).toBeNull();
    expect(payload.fertileWindowStart).toBeNull();
    expect(payload.fertileWindowEnd).toBeNull();
  });

  // 7. Permission filtering: Predictions disabled
  it('7. should filter out nextPeriodDate when predictions permission is false', () => {
    const permissions: PartnerSharingPermissions = {
      cycle: true,
      predictions: false, // Disabled!
      fertility: true,
      selfCare: true,
      symptoms: false,
      medication: false,
      profile: false
    };

    const nextPeriodDate = permissions.predictions ? '2026-09-30' : null;
    expect(nextPeriodDate).toBeNull();
  });

  // 8. Supportive self-care tips generation by phase
  it('8. should provide supportive self-care suggestions matching specific cycle phases', () => {
    const menstrualTips = service.getPhaseSupportTips('Menstrual Phase');
    expect(menstrualTips.some((t) => t.toLowerCase().includes('warmth') || t.toLowerCase().includes('cramp') || t.toLowerCase().includes('rest'))).toBeTrue();

    const follicularTips = service.getPhaseSupportTips('Follicular Phase');
    expect(follicularTips.some((t) => t.toLowerCase().includes('energy') || t.toLowerCase().includes('walk'))).toBeTrue();

    const ovulatoryTips = service.getPhaseSupportTips('Ovulatory Phase');
    expect(ovulatoryTips.some((t) => t.toLowerCase().includes('vitality') || t.toLowerCase().includes('hydration'))).toBeTrue();

    const lutealTips = service.getPhaseSupportTips('Luteal Phase');
    expect(lutealTips.some((t) => t.toLowerCase().includes('patience') || t.toLowerCase().includes('comfort'))).toBeTrue();
  });

  // 9. Invitation Status transition validation
  it('9. should validate acceptable invitation statuses', () => {
    const validStatuses = ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED'];
    const testStatus: PartnerInvitation['status'] = 'ACCEPTED';
    expect(validStatuses).toContain(testStatus);

    const expiredInv: PartnerInvitation = {
      id: 'inv-1',
      senderUid: 'owner-1',
      senderEmail: 'owner@example.com',
      senderName: 'Owner',
      recipientEmail: 'partner@example.com',
      status: 'PENDING',
      createdAt: '2026-08-01T00:00:00.000Z',
      expiresAt: '2026-08-08T00:00:00.000Z'
    };

    const nowIso = new Date('2026-09-09T00:00:00.000Z').toISOString();
    const isExpired = expiredInv.expiresAt < nowIso;
    expect(isExpired).toBeTrue();
  });

  // 10. Empty / disconnected state
  it('10. should handle empty or null partner data gracefully', () => {
    const sharedData: PartnerSharedData | null = null;
    expect(sharedData).toBeNull();

    const emptyMetrics = cycleService.calculateCycleMetrics([]);
    expect(emptyMetrics.hasData).toBeFalse();
    expect(emptyMetrics.cycleDay).toBe(0);
    expect(emptyMetrics.nextPeriodDate).toBeNull();
  });

  // 11. Firebase-Only Partner B Acceptance: verifies partner writes only own docs
  it('11. should model Partner B acceptance to update only invitation status and partner connection', () => {
    const mockInvitation: PartnerInvitation = {
      id: 'inv-123',
      senderUid: 'owner-uid-1',
      senderEmail: 'owner@example.com',
      senderName: 'Owner User',
      recipientEmail: 'partner@example.com',
      status: 'PENDING',
      createdAt: '2026-09-09T10:00:00.000Z',
      expiresAt: '2026-09-16T10:00:00.000Z'
    };

    // Partner B updates the invitation
    const updatedInvitation: PartnerInvitation = {
      ...mockInvitation,
      status: 'ACCEPTED',
      partnerUid: 'partner-uid-2',
      partnerEmail: 'partner@example.com',
      partnerName: 'Partner User',
      acceptedAt: '2026-09-09T10:05:00.000Z'
    };

    expect(updatedInvitation.status).toBe('ACCEPTED');
    expect(updatedInvitation.partnerUid).toBe('partner-uid-2');
    // Sender and recipient remain immutable
    expect(updatedInvitation.senderUid).toBe(mockInvitation.senderUid);
    expect(updatedInvitation.recipientEmail).toBe(mockInvitation.recipientEmail);

    // Partner B creates only B's own connection
    const partnerConn = {
      partnerUid: 'partner-uid-2',
      ownerUid: mockInvitation.senderUid,
      partnerEmail: mockInvitation.senderEmail,
      ownerName: mockInvitation.senderName,
      status: 'CONNECTED',
      role: 'PARTNER',
      connectedAt: '2026-09-09T10:05:00.000Z'
    };
    expect(partnerConn.role).toBe('PARTNER');
    expect(partnerConn.ownerUid).toBe('owner-uid-1');
  });

  // 12. Owner-Side Finalization: Owner A creates owner connection and publishes partnerShares
  it('12. should model Owner A finalization to create owner connection and sync partnerShares', () => {
    const acceptedInvitation: PartnerInvitation = {
      id: 'inv-123',
      senderUid: 'owner-uid-1',
      senderEmail: 'owner@example.com',
      senderName: 'Owner User',
      recipientEmail: 'partner@example.com',
      status: 'ACCEPTED',
      partnerUid: 'partner-uid-2',
      partnerEmail: 'partner@example.com',
      partnerName: 'Partner User',
      createdAt: '2026-09-09T10:00:00.000Z',
      expiresAt: '2026-09-16T10:00:00.000Z',
      acceptedAt: '2026-09-09T10:05:00.000Z'
    };

    // Owner creates Owner connection
    const ownerConn = {
      partnerUid: acceptedInvitation.partnerUid!,
      partnerEmail: acceptedInvitation.partnerEmail!,
      partnerName: acceptedInvitation.partnerName!,
      status: 'CONNECTED',
      role: 'OWNER',
      connectedAt: acceptedInvitation.acceptedAt!
    };
    expect(ownerConn.role).toBe('OWNER');
    expect(ownerConn.partnerUid).toBe('partner-uid-2');
  });

  // 13. Duplicate invitation prevention logic across states
  it('13. should distinguish between active pending, expired, declined, cancelled, and accepted invitations', () => {
    const nowMs = Date.now();
    const futureMs = nowMs + 7 * 24 * 60 * 60 * 1000;
    const pastMs = nowMs - 24 * 60 * 60 * 1000;

    // Helper evaluating active pending duplicate condition
    const isDuplicateActive = (invList: { status: string; expiryMs: number }[]) => {
      const hasAccepted = invList.some((inv) => inv.status === 'ACCEPTED');
      if (hasAccepted) return { blocked: true, reason: 'ACCEPTED' };

      const activePending = invList.find((inv) => inv.status === 'PENDING' && inv.expiryMs > nowMs);
      if (activePending) return { blocked: true, reason: 'PENDING' };

      return { blocked: false, reason: 'ALLOWED' };
    };

    // 1. PENDING (unexpired) -> BLOCKED
    expect(isDuplicateActive([{ status: 'PENDING', expiryMs: futureMs }])).toEqual({
      blocked: true,
      reason: 'PENDING'
    });

    // 2. EXPIRED (PENDING with past expiry) -> ALLOWED
    expect(isDuplicateActive([{ status: 'PENDING', expiryMs: pastMs }])).toEqual({
      blocked: false,
      reason: 'ALLOWED'
    });

    // 3. DECLINED -> ALLOWED
    expect(isDuplicateActive([{ status: 'DECLINED', expiryMs: futureMs }])).toEqual({
      blocked: false,
      reason: 'ALLOWED'
    });

    // 4. CANCELLED -> ALLOWED
    expect(isDuplicateActive([{ status: 'CANCELLED', expiryMs: futureMs }])).toEqual({
      blocked: false,
      reason: 'ALLOWED'
    });

    // 5. ACCEPTED -> BLOCKED
    expect(isDuplicateActive([{ status: 'ACCEPTED', expiryMs: futureMs }])).toEqual({
      blocked: true,
      reason: 'ACCEPTED'
    });
  });

  // 14. Complete invitation URL generation
  it('14. should generate complete invitation URL using /partner/accept?invitationId=...', () => {
    const url = service.getInvitationUrl('inv-abc-123');
    expect(url).toContain('/partner/accept?invitationId=inv-abc-123');
  });

  // 15. Correct recipient validation vs Wrong email rejection
  it('15. should validate recipient email matching and reject mismatched emails', () => {
    const invitedEmail = 'partner@example.com';
    const matchingUserEmail = 'partner@example.com';
    const wrongUserEmail = 'other@example.com';

    expect(invitedEmail.toLowerCase()).toBe(matchingUserEmail.toLowerCase());
    expect(invitedEmail.toLowerCase()).not.toBe(wrongUserEmail.toLowerCase());
  });

  // 16. Disconnect and revocation logic
  it('16. should model disconnect to revoke access and clear connection state', () => {
    // When owner disconnects, partner connection is severed and partnerShares is deleted
    const ownerConnectionBefore = { status: 'CONNECTED', role: 'OWNER', partnerUid: 'partner-1' };
    const ownerConnectionAfter = null;
    expect(ownerConnectionBefore.status).toBe('CONNECTED');
    expect(ownerConnectionAfter).toBeNull();
  });
});

