"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { apiClient } from "./client";

export function useCurrentUser() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const authUserId = session?.user?.id;

  const query = useQuery({
    queryKey: ["domain-user", authUserId],
    queryFn: () => apiClient.getMyDomainUser(authUserId!),
    enabled: Boolean(authUserId),
    staleTime: 60_000,
    retry: false,
  });

  return {
    session,
    sessionPending,
    domainUser: query.data ?? null,
    isLoading: sessionPending || query.isLoading,
    isLinked: Boolean(query.data),
    error: query.error,
    refetch: query.refetch,
  };
}
