import AsyncStorage from "@react-native-async-storage/async-storage";

const STATS_KEY = "speaking_listining_stats";

const MINUTES_PER_QUESTION = 0.5;
const MINUTES_PER_TURN = 1;

export interface SpeakingListiningStats {
  minutesSpoken: number;
  minutesListened: number;
  questionsAnswered: number;
  questionsListened: number;
  lastUpdate: string;
  conversationTurns: number;
}

const readStats = async (): Promise<SpeakingListiningStats> => {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) {
      return getDefautlStats();
    }

    return JSON.parse(raw) as SpeakingListiningStats;
  } catch (error) {
    return getDefautlStats();
  }
};

const writeStats = async (stats: SpeakingListiningStats) => {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

const getDefautlStats = (): SpeakingListiningStats => ({
  minutesSpoken: 0,
  minutesListened: 0,
  questionsAnswered: 0,
  questionsListened: 0,
  lastUpdate: new Date().toISOString(),
  conversationTurns: 0,
});

export const recordQuestionAnswered = async () => {
  const stats = await readStats();
  stats.questionsAnswered += 1;
  stats.minutesSpoken = stats.questionsAnswered * MINUTES_PER_QUESTION;
  stats.lastUpdate = new Date().toISOString();
  await writeStats(stats);
};

export const recordQuestionListened = async () => {
  const stats = await readStats();
  stats.questionsListened += 1;
  stats.minutesListened = stats.questionsListened * MINUTES_PER_QUESTION;
  stats.lastUpdate = new Date().toISOString();
  await writeStats(stats);
};

export const recordConversationTurn = async () => {
  const stats = await readStats();
  stats.conversationTurns += 1;

  stats.minutesSpoken += MINUTES_PER_TURN;
  stats.minutesListened += MINUTES_PER_TURN;
  stats.lastUpdate = new Date().toISOString();
  await writeStats(stats);
};

export const getWeeklyStats = async () => {
  const stats = await readStats();

  return {
    minutesSpoken: Math.round(stats.minutesSpoken * 10) / 10,
    minutesListened: Math.round(stats.minutesListened * 10) / 10,
    weeklyChange: {
      spoken: 0,
      listened: 0,
    },
  };
};
