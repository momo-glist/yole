import courseData from "@/assets/data/course_content.json";
import { Ionicons } from "@expo/vector-icons";

export interface lesson {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  questions: Question[];
}
interface BaseQuestion {
  id: number;
}

export interface chapter {
  id: number;
  title: string;
  lessons: lesson[];
  review?: lesson;
}

export interface CourseData {
  chapters: chapter[];
  scenarios: conversationScenario[];
}

export interface conversationScenario {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isFree: boolean;
  description: string;
  goal: string;
  tasks: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  phrasebook?: PhraseBookEntry[];
}

interface PhraseBookEntry {
  characters: string;
  ipa: string;
  french: string;
}

interface EnglishPrompt {
  characters: string;
  ipa: string;
}

export interface Word {
  characters: string;
  ipa: string;
  french: string;
  frequency: number;
}

interface EnglishPhrases {
  characters: string;
  ipa: string;
  words: Word[];
  breakdown: string;
}

export interface SpeakingOptions {
  id: number;
  french: string;
  english: EnglishPhrases;
}

export interface ListeningOptions {
  id: number;
  french: string;
  english: EnglishPhrases;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  english: EnglishPrompt;
  options: SpeakingOptions[];
  correctOptionId: number;
}

interface SingleResponseQuestion extends BaseQuestion {
  type: "single_response";
  english: EnglishPrompt;
  options: [SpeakingOptions];
}

interface ListeningMultipleChoiceQuestion extends BaseQuestion {
  type: "listening_mc";
  english: EnglishPrompt & {
    words: Word[];
    breakdown: string;
  };
  options: ListeningOptions[];
  correctOptionId: number;
}

export type Question =
  | MultipleChoiceQuestion
  | SingleResponseQuestion
  | ListeningMultipleChoiceQuestion;

export const COURSE_DATA = courseData as unknown as CourseData;
