import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  premiumExpiresAt: string | null;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: false,
  isPremium: false,
  isAdmin: false,
  premiumExpiresAt: null,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);
