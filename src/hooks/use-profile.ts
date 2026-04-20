import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type UserRole = "user" | "admin";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

const PROFILE_QUERY_KEY = ["profile"];

async function fetchOwnProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // 還沒建立 profile（trigger 還沒跑完）
    throw error;
  }
  return data as Profile;
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth();

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...PROFILE_QUERY_KEY, user?.id],
    queryFn: fetchOwnProfile,
    enabled: !!user,
    staleTime: 30_000,
    retry: 3,
    retryDelay: 500,
  });

  return {
    profile,
    isLoading: authLoading || isLoading,
    error,
    refetch,
    isAdmin: profile?.role === "admin",
    isApproved: profile?.approved === true,
  };
}
