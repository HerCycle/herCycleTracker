import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  docData,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  collectionData,
  query,
  where,
  addDoc,
  updateDoc,
  getDocs,
  Timestamp,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { CycleService, CycleMetrics } from './cycle.service';

export interface PartnerInvitation {
  id?: string;
  senderUid: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  expiresAt: any;
  partnerUid?: string;
  partnerEmail?: string;
  partnerName?: string;
  acceptedAt?: any;
}

export interface PartnerConnection {
  partnerUid: string;
  partnerEmail: string;
  partnerName: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  connectedAt: string;
  role?: 'OWNER' | 'PARTNER';
  ownerUid?: string;
  ownerName?: string;
}

export interface PartnerSharingPermissions {
  cycle: boolean;
  predictions: boolean;
  fertility: boolean;
  selfCare: boolean;
  symptoms: boolean;
  medication: boolean;
  profile: boolean;
}

export const DEFAULT_SHARING_PERMISSIONS: PartnerSharingPermissions = {
  cycle: true,
  predictions: true,
  fertility: true,
  selfCare: true,
  symptoms: false,
  medication: false,
  profile: false
};

export interface PartnerSharedData {
  ownerUid: string;
  partnerUid: string;
  ownerName: string;
  permissions: PartnerSharingPermissions;
  currentCycleDay?: number | null;
  cyclePhase?: string | null;
  nextPeriodDate?: string | null;
  ovulationDate?: string | null;
  fertileWindowStart?: string | null;
  fertileWindowEnd?: string | null;
  periodStatus?: string | null;
  sharedSelfCare?: string[] | null;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PartnerService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly cycleService = inject(CycleService);

  // --- Partner Connection Realtime Stream (reads authenticated user's own document) ---
  getPartnerConnection(): Observable<{ success: boolean; data: PartnerConnection | null }> {
    return user(this.auth).pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) return of({ success: true, data: null });
        const docRef = doc(this.firestore, `users/${firebaseUser.uid}/partner/connection`);
        return (docData(docRef) as Observable<PartnerConnection | undefined>).pipe(
          map((data) => ({
            success: true,
            data: data && data.status === 'CONNECTED' ? data : null
          }))
        );
      }),
      catchError((err) => {
        console.error('getPartnerConnection error:', err);
        return of({ success: true, data: null });
      })
    );
  }

  // --- Sent Invitations Stream (Listens to all invitations sent by this owner) ---
  getSentInvitations(): Observable<PartnerInvitation[]> {
    return user(this.auth).pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) return of([]);
        const colRef = collection(this.firestore, 'partnerInvitations');
        // Query constrained by senderUid == firebaseUser.uid for Firestore rule compliance
        const q = query(
          colRef,
          where('senderUid', '==', firebaseUser.uid)
        );
        return (collectionData(q, { idField: 'id' }) as Observable<PartnerInvitation[]>).pipe(
          map((invitations) => {
            const nowMs = Date.now();
            return invitations.map((inv) => {
              const expiryMs = inv.expiresAt?.toMillis
                ? inv.expiresAt.toMillis()
                : (typeof inv.expiresAt === 'string' ? new Date(inv.expiresAt).getTime() : nowMs);
              return {
                ...inv,
                status: (inv.status === 'PENDING' && expiryMs < nowMs) ? 'EXPIRED' : inv.status
              };
            });
          })
        );
      }),
      catchError((err) => {
        console.error('getSentInvitations error:', err);
        return of([]);
      })
    );
  }

  // --- Incoming Invitations Stream (for the partner: recipientEmail == partnerEmail) ---
  getIncomingInvitations(): Observable<PartnerInvitation[]> {
    return user(this.auth).pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser || !firebaseUser.email) return of([]);
        const normalizedEmail = firebaseUser.email.trim().toLowerCase();
        const colRef = collection(this.firestore, 'partnerInvitations');
        // Query constrained by recipientEmail == normalizedEmail for Firestore rule compliance
        const q = query(
          colRef,
          where('recipientEmail', '==', normalizedEmail),
          where('status', '==', 'PENDING')
        );
        return (collectionData(q, { idField: 'id' }) as Observable<PartnerInvitation[]>).pipe(
          map((invitations) => {
            const nowMs = Date.now();
            return invitations
              .filter((inv) => {
                const expiryMs = inv.expiresAt?.toMillis
                  ? inv.expiresAt.toMillis()
                  : (typeof inv.expiresAt === 'string' ? new Date(inv.expiresAt).getTime() : nowMs);
                return expiryMs >= nowMs;
              })
              .map((inv) => ({ ...inv }));
          })
        );
      }),
      catchError((err) => {
        console.error('getIncomingInvitations error:', err);
        return of([]);
      })
    );
  }

  // --- Read Single Invitation by ID ---
  async getInvitationById(invitationId: string): Promise<PartnerInvitation | null> {
    try {
      const docRef = doc(this.firestore, `partnerInvitations/${invitationId}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as PartnerInvitation;
      }
      return null;
    } catch (err) {
      console.error('getInvitationById error:', err);
      return null;
    }
  }

  // --- Complete Invitation URL Generation ---
  getInvitationUrl(invitationId: string): string {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    return `${origin}/partner/accept?invitationId=${invitationId}`;
  }

  // --- Create an Invitation (Owner Action) ---
  async createInvitation(rawRecipientEmail: string): Promise<{
    success: boolean;
    invitation?: PartnerInvitation;
    message?: string;
  }> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'You must be authenticated to send an invitation.' };
    }

    const recipientEmail = (rawRecipientEmail || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const senderEmail = (currentUser.email || '').trim().toLowerCase();
    if (recipientEmail === senderEmail) {
      return { success: false, message: 'You cannot invite yourself as a partner.' };
    }

    try {
      // 1. Check if already connected in owner's own connection doc
      const connDocRef = doc(this.firestore, `users/${currentUser.uid}/partner/connection`);
      const connSnap = await getDoc(connDocRef);
      if (connSnap.exists() && connSnap.data()?.['status'] === 'CONNECTED') {
        return {
          success: false,
          message: 'You already have an active partner connected. Disconnect first to invite someone else.'
        };
      }

      // 2. Check for duplicate pending or accepted invitations to the same recipient
      const colRef = collection(this.firestore, 'partnerInvitations');
      const q = query(
        colRef,
        where('senderUid', '==', currentUser.uid),
        where('recipientEmail', '==', recipientEmail)
      );
      const existingSnap = await getDocs(q);
      const nowMs = Date.now();

      // Check if partner already accepted an invitation
      const hasAccepted = existingSnap.docs.some((d) => d.data()['status'] === 'ACCEPTED');
      if (hasAccepted) {
        return {
          success: false,
          message: 'An active invitation has already been accepted by this partner.'
        };
      }

      // Check for active unexpired pending invitation
      const activePending = existingSnap.docs.find((d) => {
        const data = d.data();
        if (data['status'] !== 'PENDING') return false;
        const exp = data['expiresAt'];
        const expiryMs = exp?.toMillis ? exp.toMillis() : (typeof exp === 'string' ? new Date(exp).getTime() : nowMs);
        return expiryMs > nowMs;
      });

      if (activePending) {
        return {
          success: false,
          message: 'An active invitation has already been sent to this partner.'
        };
      }

      // 3. Sender profile name
      let senderName = currentUser.displayName || '';
      if (!senderName) {
        try {
          const userDocRef = doc(this.firestore, `users/${currentUser.uid}`);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            senderName = `${data['firstName'] || ''} ${data['lastName'] || ''}`.trim();
          }
        } catch (_) {}
      }
      if (!senderName) {
        senderName = senderEmail.split('@')[0] || 'HerCycle Member';
      }

      // 4. Expiration timestamp (7 days) as Firestore Timestamp
      const createdAt = new Date().toISOString();
      const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invitationPayload: Omit<PartnerInvitation, 'id'> = {
        senderUid: currentUser.uid,
        senderEmail: senderEmail,
        senderName: senderName,
        recipientEmail: recipientEmail,
        status: 'PENDING',
        createdAt,
        expiresAt
      };

      const docRef = await addDoc(colRef, invitationPayload);
      const created: PartnerInvitation = {
        id: docRef.id,
        ...invitationPayload
      };

      return { success: true, invitation: created };
    } catch (err: any) {
      console.error('createInvitation error:', err);
      return { success: false, message: err.message || 'Failed to create partner invitation.' };
    }
  }

  // --- Cancel Invitation (Owner Action) ---
  async cancelInvitation(invitationId: string): Promise<{ success: boolean; message?: string }> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'You must be authenticated.' };
    }

    try {
      const docRef = doc(this.firestore, `partnerInvitations/${invitationId}`);
      await updateDoc(docRef, { status: 'CANCELLED' });
      return { success: true };
    } catch (err: any) {
      console.error('cancelInvitation error:', err);
      return { success: false, message: err.message || 'Failed to cancel invitation.' };
    }
  }

  // --- Decline Invitation (Partner Action) ---
  async declineInvitation(invitationId: string): Promise<{ success: boolean; message?: string }> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'You must be authenticated.' };
    }

    try {
      const docRef = doc(this.firestore, `partnerInvitations/${invitationId}`);
      await updateDoc(docRef, { status: 'DECLINED' });
      return { success: true };
    } catch (err: any) {
      console.error('declineInvitation error:', err);
      return { success: false, message: err.message || 'Failed to decline invitation.' };
    }
  }

  // --- Accept Invitation (Partner B Action) ---
  // IMPORTANT: Partner B writes ONLY to partnerInvitations/{id} and users/{partnerB.uid}/partner/connection!
  // Partner B NEVER attempts to write users/{ownerUid}/... or partnerShares/{ownerUid}.
  async acceptInvitation(invitationId: string): Promise<{ success: boolean; message?: string }> {
    const partnerUser = this.auth.currentUser;
    if (!partnerUser) {
      return { success: false, message: 'Please sign in or register to accept this invitation.' };
    }

    try {
      const invDocRef = doc(this.firestore, `partnerInvitations/${invitationId}`);
      const invSnap = await getDoc(invDocRef);
      if (!invSnap.exists()) {
        return { success: false, message: 'Invitation not found or has been removed.' };
      }

      const invitation = invSnap.data() as PartnerInvitation;

      if (invitation.status !== 'PENDING') {
        return {
          success: false,
          message: `This invitation is no longer pending (Status: ${invitation.status}).`
        };
      }

      const nowMs = Date.now();
      const expiryMs = invitation.expiresAt?.toMillis
        ? invitation.expiresAt.toMillis()
        : (typeof invitation.expiresAt === 'string' ? new Date(invitation.expiresAt).getTime() : nowMs);
      if (expiryMs < nowMs) {
        return { success: false, message: 'This invitation has expired.' };
      }

      const partnerEmail = (partnerUser.email || '').trim().toLowerCase();
      if (invitation.recipientEmail.trim().toLowerCase() !== partnerEmail) {
        return {
          success: false,
          message: `This invitation was addressed to ${invitation.recipientEmail}, but you are currently signed in as ${partnerEmail}.`
        };
      }

      // Resolve partner display name
      let partnerName = partnerUser.displayName || '';
      if (!partnerName) {
        try {
          const profileDoc = await getDoc(doc(this.firestore, `users/${partnerUser.uid}`));
          if (profileDoc.exists()) {
            const d = profileDoc.data();
            partnerName = `${d['firstName'] || ''} ${d['lastName'] || ''}`.trim();
          }
        } catch (_) {}
      }
      if (!partnerName) {
        partnerName = partnerEmail.split('@')[0] || 'Partner';
      }

      // 1. Partner B updates ONLY the invitation document with trusted serverTimestamp()
      await updateDoc(invDocRef, {
        status: 'ACCEPTED',
        partnerUid: partnerUser.uid,
        partnerEmail: partnerEmail,
        partnerName: partnerName,
        acceptedAt: serverTimestamp()
      });

      // 2. Partner B writes ONLY to Partner B's OWN connection document: users/{partnerUser.uid}/partner/connection
      const partnerConnRef = doc(this.firestore, `users/${partnerUser.uid}/partner/connection`);
      const partnerConnData: PartnerConnection = {
        partnerUid: partnerUser.uid,
        ownerUid: invitation.senderUid,
        partnerEmail: invitation.senderEmail,
        partnerName: partnerName,
        ownerName: invitation.senderName,
        status: 'CONNECTED',
        connectedAt: new Date().toISOString(),
        role: 'PARTNER'
      };
      await setDoc(partnerConnRef, partnerConnData);

      // Note: Partner B DOES NOT write users/{ownerUid}/partner/connection or partnerShares/{ownerUid}.
      // Owner A's real-time listener will finalize the owner connection and sync shared data.
      return { success: true };
    } catch (err: any) {
      console.error('acceptInvitation error:', err);
      return { success: false, message: err.message || 'Failed to accept invitation.' };
    }
  }

  // --- Finalize Connection on Owner A Side (Owner Action) ---
  // Triggered automatically when Owner A's real-time listener detects an accepted invitation.
  // Because Owner A is the authenticated owner, Owner A writes to users/{ownerUid} and partnerShares/{ownerUid}.
  async finalizeOwnerConnection(invitation: PartnerInvitation): Promise<void> {
    const ownerUser = this.auth.currentUser;
    if (!ownerUser || ownerUser.uid !== invitation.senderUid) return;
    if (invitation.status !== 'ACCEPTED' || !invitation.partnerUid) return;

    try {
      // 1. Write Owner A's connection document: users/{ownerUser.uid}/partner/connection
      const ownerConnRef = doc(this.firestore, `users/${ownerUser.uid}/partner/connection`);
      const ownerConnData: PartnerConnection = {
        partnerUid: invitation.partnerUid,
        partnerEmail: invitation.partnerEmail || invitation.recipientEmail,
        partnerName: invitation.partnerName || 'Partner',
        status: 'CONNECTED',
        connectedAt: invitation.acceptedAt || new Date().toISOString(),
        role: 'OWNER'
      };
      await setDoc(ownerConnRef, ownerConnData);

      // 2. Ensure default sharing settings exist
      const shareSettingsRef = doc(this.firestore, `users/${ownerUser.uid}/partner/sharing`);
      const shareSettingsSnap = await getDoc(shareSettingsRef);
      if (!shareSettingsSnap.exists()) {
        await setDoc(shareSettingsRef, DEFAULT_SHARING_PERMISSIONS);
      }

      // 3. Sync shared data to partnerShares/{ownerUser.uid}
      await this.syncSharedData();
    } catch (err) {
      console.error('finalizeOwnerConnection error:', err);
    }
  }

  // --- Sharing Permissions Management (Owner A writes only to users/{ownerA.uid}/partner/sharing) ---
  async getSharingPermissions(uid?: string): Promise<PartnerSharingPermissions> {
    try {
      const targetUid = uid || this.auth.currentUser?.uid;
      if (!targetUid) return { ...DEFAULT_SHARING_PERMISSIONS };

      const docRef = doc(this.firestore, `users/${targetUid}/partner/sharing`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...DEFAULT_SHARING_PERMISSIONS, ...snap.data() } as PartnerSharingPermissions;
      }
      return { ...DEFAULT_SHARING_PERMISSIONS };
    } catch (err) {
      console.error('getSharingPermissions error:', err);
      return { ...DEFAULT_SHARING_PERMISSIONS };
    }
  }

  async updateSharingPermissions(
    permissions: PartnerSharingPermissions
  ): Promise<{ success: boolean; message?: string }> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const docRef = doc(this.firestore, `users/${currentUser.uid}/partner/sharing`);
      await setDoc(docRef, permissions, { merge: true });
      // Trigger instant real-time synchronization to partnerShares/{ownerUid}
      await this.syncSharedData(permissions);
      return { success: true };
    } catch (err: any) {
      console.error('updateSharingPermissions error:', err);
      return { success: false, message: err.message || 'Failed to update sharing permissions.' };
    }
  }

  // --- Real-time Shared Data Synchronization (Owner is the ONLY writer of partnerShares/{ownerUid}) ---
  async syncSharedData(explicitPermissions?: PartnerSharingPermissions): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return;

    try {
      // 1. Verify owner connection
      const connDocRef = doc(this.firestore, `users/${currentUser.uid}/partner/connection`);
      const connSnap = await getDoc(connDocRef);
      if (!connSnap.exists() || connSnap.data()?.['status'] !== 'CONNECTED') {
        return;
      }
      const connData = connSnap.data() as PartnerConnection;
      const partnerUid = connData.partnerUid;
      if (!partnerUid) return;

      // 2. Load permissions
      const permissions = explicitPermissions || (await this.getSharingPermissions(currentUser.uid));

      // 3. Load owner profile for name and preferred cycle length
      let ownerName = currentUser.displayName || '';
      let preferredCycleLen: number | undefined;
      try {
        const profileSnap = await getDoc(doc(this.firestore, `users/${currentUser.uid}`));
        if (profileSnap.exists()) {
          const p = profileSnap.data();
          if (!ownerName) {
            ownerName = `${p['firstName'] || ''} ${p['lastName'] || ''}`.trim();
          }
          preferredCycleLen = p['cycleLength'];
        }
      } catch (_) {}

      if (!ownerName) {
        ownerName = currentUser.email?.split('@')[0] || 'HerCycle Member';
      }

      // 4. Calculate cycle metrics using CycleService as the source of truth
      const logs = await this.cycleService.getPeriodLogsSnapshot(currentUser.uid);
      const metrics: CycleMetrics = this.cycleService.calculateCycleMetrics(logs, preferredCycleLen);

      // 5. Construct restricted shared data representation with strictly allowed fields
      const sharedPayload: Record<string, any> = {
        ownerUid: currentUser.uid,
        partnerUid: partnerUid,
        ownerName: ownerName,
        permissions: permissions,
        updatedAt: new Date().toISOString()
      };

      if (permissions.cycle && metrics.hasData) {
        sharedPayload['currentCycleDay'] = metrics.cycleDay;
        sharedPayload['cyclePhase'] = metrics.cyclePhase;
        sharedPayload['periodStatus'] = metrics.isLate ? 'Late' : 'On Track';
      } else {
        sharedPayload['currentCycleDay'] = null;
        sharedPayload['cyclePhase'] = null;
        sharedPayload['periodStatus'] = null;
      }

      if (permissions.predictions && metrics.hasData) {
        sharedPayload['nextPeriodDate'] = metrics.nextPeriodDate;
      } else {
        sharedPayload['nextPeriodDate'] = null;
      }

      if (permissions.fertility && metrics.hasData) {
        sharedPayload['ovulationDate'] = metrics.ovulationDate;
        sharedPayload['fertileWindowStart'] = metrics.fertileWindowStart;
        sharedPayload['fertileWindowEnd'] = metrics.fertileWindowEnd;
      } else {
        sharedPayload['ovulationDate'] = null;
        sharedPayload['fertileWindowStart'] = null;
        sharedPayload['fertileWindowEnd'] = null;
      }

      if (permissions.selfCare) {
        const activePhase = (permissions.cycle && metrics.hasData) ? metrics.cyclePhase : 'General Wellness';
        sharedPayload['sharedSelfCare'] = this.getPhaseSupportTips(activePhase);
      } else {
        sharedPayload['sharedSelfCare'] = null;
      }

      // 6. Publish to partnerShares/{ownerUid} (Owner is authenticated and authorized to write)
      const shareDocRef = doc(this.firestore, `partnerShares/${currentUser.uid}`);
      await setDoc(shareDocRef, sharedPayload);
    } catch (err) {
      console.error('syncSharedData error:', err);
    }
  }

  // --- Partner Mode Stream: Partner B listens to partnerShares/{ownerUid} ---
  getSharedDataForPartner(ownerUid: string): Observable<PartnerSharedData | null> {
    const docRef = doc(this.firestore, `partnerShares/${ownerUid}`);
    return (docData(docRef) as Observable<PartnerSharedData | undefined>).pipe(
      map((data) => data || null),
      catchError((err) => {
        console.error('getSharedDataForPartner error:', err);
        return of(null);
      })
    );
  }

  // --- Disconnect Partner ---
  // Owner A deletes partnerShares/{ownerUid} and updates A's own connection.
  // Partner B updates B's own connection.
  async disconnectPartner(): Promise<{ success: boolean; message?: string }> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      // 1. Read current user's connection
      const myConnRef = doc(this.firestore, `users/${currentUser.uid}/partner/connection`);
      const myConnSnap = await getDoc(myConnRef);
      if (!myConnSnap.exists()) {
        return { success: true };
      }

      const myConn = myConnSnap.data() as PartnerConnection;

      // 2. If current user is OWNER, delete partnerShares/{currentUser.uid} to immediately revoke partner access
      if (myConn.role === 'OWNER') {
        try {
          const shareDocRef = doc(this.firestore, `partnerShares/${currentUser.uid}`);
          await deleteDoc(shareDocRef);
        } catch (shareErr) {
          console.warn('Could not delete partnerShares doc:', shareErr);
        }
      }

      // 3. Delete current user's own connection document
      await deleteDoc(myConnRef);

      return { success: true };
    } catch (err: any) {
      console.error('disconnectPartner error:', err);
      return { success: false, message: err.message || 'Failed to disconnect partner.' };
    }
  }

  // Supportive self-care tips dynamically generated by cycle phase
  getPhaseSupportTips(phase: string): string[] {
    switch (phase) {
      case 'Menstrual Phase':
        return [
          'Encourage hydration: Keep fresh water or herbal tea easily accessible.',
          'Offer comfort and warmth: A heating pad or warm blanket can relieve cramps.',
          'Support gentle rest: Help take care of household tasks to allow relaxation.',
          'Check in with compassion: Ask gently how they are feeling today.'
        ];
      case 'Follicular Phase':
        return [
          'Energy is rising: Great time to plan joint walks, cooking, or active outings.',
          'Encourage balanced nourishment: Fresh fruits, greens, and wholesome meals.',
          'Support creative ideas and shared goals during this energized phase.'
        ];
      case 'Ovulatory Phase':
        return [
          'Peak vitality and confidence: Celebrate accomplishments and social time.',
          'Encourage consistent hydration and nutritious protein-rich foods.',
          'Check in on emotional wellness and keep communication open and positive.'
        ];
      case 'Luteal Phase':
        return [
          'Practice extra patience and understanding if mood dips or tiredness sets in.',
          'Offer calming downtime: Keep evenings peaceful with low-stress activities.',
          'Have favorite comforting snacks, herbal chamomile tea, or dark chocolate handy.',
          'Listen actively without trying to fix everything—validation goes a long way.'
        ];
      default:
        return [
          'Check in thoughtfully about how they are feeling today.',
          'Encourage consistent hydration, nourishing food, and good sleep.',
          'Offer loving support and open, judgment-free communication.'
        ];
    }
  }
}
