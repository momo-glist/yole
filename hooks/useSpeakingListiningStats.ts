import { getWeeklyStats } from "@/utils/speakingListiningStats";
import { useEffect, useState } from "react";

interface weeklyStats {
  minutesSpoken: number;
  minutesListened: number;
  weeklyChange: {
    spoken: number;
    listened: number;
  };
}

export const useSpeakingListiningStats = () => {
  const [stats, setStats] = useState<weeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = async () => {
    try {
      const weeklyStats = await getWeeklyStats();
      setStats(weeklyStats);
    } catch (error) {
      console.error("Failed to load stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return { stats, loading, refreshStats };
};
