import { supabase } from './supabase';
import type { Database } from '@/types/database.types';

type BandInvitation = Database['public']['Tables']['band_invitations']['Row'];
type BandInvitationInsert = Database['public']['Tables']['band_invitations']['Insert'];

export interface CreateInviteParams {
  bandId: string;
  invitedBy: string;
  maxUses?: number | null;
  expiresInDays?: number | null;
  email?: string;
  role?: 'owner' | 'member';
}

export interface ValidateInviteResult {
  valid: boolean;
  invitation?: BandInvitation & { bands: any };
  error?: string;
}

/**
 * Generate a secure random token for invitations
 */
export function generateInviteToken(): string {
  return crypto.randomUUID();
}

/**
 * Create a new band invitation
 */
export async function createInvitation({
  bandId,
  invitedBy,
  maxUses = 1,
  expiresInDays = 7,
  email,
  role = 'member',
}: CreateInviteParams) {
  const token = generateInviteToken();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const inviteData: BandInvitationInsert = {
    band_id: bandId,
    invited_by: invitedBy,
    token,
    email,
    role,
    max_uses: maxUses,
    current_uses: 0,
    expires_at: expiresAt,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('band_invitations')
    .insert(inviteData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Validate an invitation token
 */
export async function validateInviteToken(
  token: string
): Promise<ValidateInviteResult> {
  const { data: invitation, error } = await supabase
    .from('band_invitations')
    .select('*, bands(*)')
    .eq('token', token)
    .single();

  if (error || !invitation) {
    return {
      valid: false,
      error: 'Invalid invitation token',
    };
  }

  // Check if already used up
  if (
    invitation.max_uses &&
    invitation.current_uses >= invitation.max_uses
  ) {
    return {
      valid: false,
      error: 'This invitation has already been used',
    };
  }

  // Check if expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    // Auto-update status to expired
    await supabase
      .from('band_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);

    return {
      valid: false,
      error: 'This invitation has expired',
    };
  }

  // Check if revoked
  if (invitation.status === 'revoked') {
    return {
      valid: false,
      error: 'This invitation has been revoked',
    };
  }

  return {
    valid: true,
    invitation,
  };
}

/**
 * Accept an invitation and add user to band
 */
export async function acceptInvitation(token: string, userId: string) {
  console.log('[acceptInvitation] Starting with token:', token, 'userId:', userId);

  // Validate the invitation
  const validation = await validateInviteToken(token);
  console.log('[acceptInvitation] Validation result:', validation);

  if (!validation.valid || !validation.invitation) {
    throw new Error(validation.error || 'Invalid invitation');
  }

  const invitation = validation.invitation;
  console.log('[acceptInvitation] Invitation details:', invitation);

  // Check if user is already a member
  const { data: existingMember, error: memberCheckError } = await supabase
    .from('band_members')
    .select('*')
    .eq('band_id', invitation.band_id)
    .eq('user_id', userId)
    .single();

  console.log('[acceptInvitation] Existing member check:', { existingMember, memberCheckError });

  if (existingMember) {
    // If already a member, just return the band info
    if (existingMember.status === 'active') {
      console.log('[acceptInvitation] User is already an active member');
      return {
        bandId: invitation.band_id,
        alreadyMember: true,
      };
    }

    // If inactive, reactivate them
    console.log('[acceptInvitation] Reactivating inactive member');
    const { error: reactivateError } = await supabase
      .from('band_members')
      .update({ status: 'active', role: invitation.role })
      .eq('id', existingMember.id);

    if (reactivateError) {
      console.error('[acceptInvitation] Error reactivating member:', reactivateError);
      throw reactivateError;
    }
  } else {
    // Add user to band
    console.log('[acceptInvitation] Adding new member to band');
    const { error: memberError } = await supabase.from('band_members').insert({
      band_id: invitation.band_id,
      user_id: userId,
      role: invitation.role,
      status: 'active',
    });

    if (memberError) {
      console.error('[acceptInvitation] Error adding member:', memberError);
      throw memberError;
    }
  }

  // Update invitation usage
  console.log('[acceptInvitation] Updating invitation usage');
  const { error: updateError } = await supabase
    .from('band_invitations')
    .update({
      current_uses: invitation.current_uses + 1,
      status:
        invitation.max_uses && invitation.current_uses + 1 >= invitation.max_uses
          ? 'accepted'
          : 'pending',
    })
    .eq('id', invitation.id);

  if (updateError) {
    console.error('[acceptInvitation] Failed to update invitation usage:', updateError);
  }

  console.log('[acceptInvitation] Successfully accepted invitation');
  return {
    bandId: invitation.band_id,
    alreadyMember: false,
  };
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(invitationId: string) {
  const { error } = await supabase
    .from('band_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);

  if (error) {
    throw error;
  }
}

/**
 * Get all invitations for a band
 */
export async function getBandInvitations(bandId: string) {
  const { data, error } = await supabase
    .from('band_invitations')
    .select('*, profiles(*)')
    .eq('band_id', bandId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Generate the full invite URL
 */
export function generateInviteUrl(token: string): string {
  // For development, you might want to use a different URL
  // For production, this should be your app's deep link URL
  const baseUrl = __DEV__
    ? 'http://localhost:8081'
    : 'https://bandly.app'; // Replace with your actual domain

  return `${baseUrl}/invite/${token}`;
}
