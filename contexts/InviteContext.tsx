import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  createInvitation,
  validateInviteToken,
  acceptInvitation,
  revokeInvitation,
  getBandInvitations,
  generateInviteUrl,
  checkUserExists,
  type CreateInviteParams,
  type ValidateInviteResult,
} from '@/lib/invites';
import type { Database } from '@/types/database.types';

type BandInvitation = Database['public']['Tables']['band_invitations']['Row'];

interface InviteContextType {
  // Pending invite token (stored when user clicks invite link before auth)
  pendingInviteToken: string | null;
  setPendingInviteToken: (token: string | null) => void;

  // Create a new invitation
  createInvite: (params: CreateInviteParams) => Promise<{
    invitation: BandInvitation;
    inviteUrl: string;
  }>;

  // Validate an invite token
  validateInvite: (token: string) => Promise<ValidateInviteResult>;

  // Accept an invitation (add user to band)
  acceptInvite: (token: string, userId: string, isNewSignup?: boolean) => Promise<{
    bandId: string;
    alreadyMember: boolean;
    isPending: boolean;
  }>;

  // Check if user exists by email
  checkUserByEmail: (email: string) => Promise<string | null>;

  // Revoke an invitation
  revokeInvite: (invitationId: string) => Promise<void>;

  // Get all invitations for a band
  fetchBandInvites: (bandId: string) => Promise<BandInvitation[]>;

  // Loading state
  isLoading: boolean;

  // Error state
  error: string | null;
}

const InviteContext = createContext<InviteContextType | undefined>(undefined);

export function InviteProvider({ children }: { children: React.ReactNode }) {
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvite = useCallback(async (params: CreateInviteParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const invitation = await createInvitation(params);
      const inviteUrl = generateInviteUrl(invitation.token);

      return { invitation, inviteUrl };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invitation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateInvite = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await validateInviteToken(token);
      if (!result.valid) {
        setError(result.error || 'Invalid invitation');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate invitation';
      setError(errorMessage);
      return { valid: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptInvite = useCallback(
    async (token: string, userId: string, isNewSignup: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await acceptInvitation(token, userId, isNewSignup);
        // Clear pending token after successful acceptance
        setPendingInviteToken(null);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const checkUserByEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      return await checkUserExists(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check user';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revokeInvite = useCallback(async (invitationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await revokeInvitation(invitationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke invitation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBandInvites = useCallback(async (bandId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      return await getBandInvitations(bandId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invitations';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <InviteContext.Provider
      value={{
        pendingInviteToken,
        setPendingInviteToken,
        createInvite,
        validateInvite,
        acceptInvite,
        checkUserByEmail,
        revokeInvite,
        fetchBandInvites,
        isLoading,
        error,
      }}
    >
      {children}
    </InviteContext.Provider>
  );
}

export function useInvite() {
  const context = useContext(InviteContext);
  if (context === undefined) {
    throw new Error('useInvite must be used within an InviteProvider');
  }
  return context;
}
