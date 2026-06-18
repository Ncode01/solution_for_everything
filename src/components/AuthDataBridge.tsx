/**
 * AuthDataBridge
 *
 * Keeps AppDataContext's audit actor ID in sync with the logged-in profile.
 * Rendered once at the top of the app tree, inside both providers.
 */
import { useEffect } from 'react';
import { useAuth } from '../state/AuthContext';
import { useAppData } from '../state/AppDataContext';

export default function AuthDataBridge() {
  const { profile } = useAuth();
  const { setActorId, setActorName } = useAppData();

  useEffect(() => {
    setActorId(profile?.id ?? null);
    setActorName(profile?.displayName ?? null);
  }, [profile, setActorId, setActorName]);

  return null;
}
