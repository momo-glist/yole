import { Question } from "@/constants/CourseData";
import { recordQuestionListened } from "@/utils/speakingListiningStats";
import { Audio } from "expo-av";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import ConfirmDialog from "../ui/ConfirmDialog";
import AudioPrompt from "./AudioPrompt";
import Progressheader from "./ProgressHeader";

interface WrongQuestion {
  french: string;
  english: {
    characters: string;
    ipa: string;
  };
  attempts: number;
}

export interface LessonStats {
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  wrongQuestions?: WrongQuestion[];
}

export default function LessonContent({
  questions,
  lessonId,
}: {
  questions: Question[];
  lessonId?: string;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasListedToAudio, setHasListedToAudio] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempCount, setAttemptCount] = useState(0);
  const [isRecognazing, setIsRecognazing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [transcription, setTranscription] = useState<{
    expected: string;
    said: string;
  } | null>(null);
  const currentQuestion = useMemo(
    () => questions[currentQuestionIndex],
    [currentQuestionIndex, questions],
  );
  const [isSpeechPlaying, setIsSpeechPlaying] = useState(false);
  const [showCompletScreen, setShowCompletScreen] = useState(false);
  const [lessonStats, setLessonStats] = useState<LessonStats | null>(null);
  const [questionAttempts, setQuestionAttempts] = useState<
    Record<number, number>
  >({});
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<Set<number>>(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const optionAnimationValue = useRef(new Animated.Value(0)).current;
  const audioSectionAnimHeight = useRef(new Animated.Value(400)).current;
  const optionSelectionAnim = useRef(new Animated.Value(0)).current;
  const instructionOpacity = useRef(new Animated.Value(1)).current;
  const listinigOpacity = useRef(new Animated.Value(0)).current;
  const listinigScale = useRef(new Animated.Value(0.95)).current;
  const [hasStartedFirstPlay, setHasStartedFirstPlay] = useState(false);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const finishListining = () => {
    if (hasListedToAudio) return;
    setHasListedToAudio(true);
    setIsSpeechPlaying(false);
    void recordQuestionListened();
    Animated.parallel([
      Animated.timing(audioSectionAnimHeight, {
        toValue: 200,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(optionAnimationValue, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const playAudio = () => {
    const textToSpeack =
      currentQuestion.english.characters || currentQuestion.english.ipa;

    if (isSpeechPlaying) {
      Speech.stop();
      setIsSpeechPlaying(false);
      return;
    }

    setIsSpeechPlaying(true);
    Speech.speak(textToSpeack, {
      language: "en-EN",
      onDone: () => {
        setIsSpeechPlaying(false);
        finishListining();
      },
      onStopped: () => {
        setIsSpeechPlaying(false);
      },
      onError: () => {
        setIsSpeechPlaying(false);
      },
    });
  };

  const handleRevealEnglish = () => {
    if (showEnglish) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setShowEnglish(false));
    } else {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={styles.container}>
      <ConfirmDialog
        visible={exitConfirmVisible}
        title={"Quitter la léçon"}
        description={
          "Etes vous sûr de vouloir quitter la leçon? Votre progression ne sera pas sauvegardée."
        }
        confirmLabel={"Quitter"}
        cancelLabel={"Annuler"}
        onConfirm={() => {
          setExitConfirmVisible(false);
          router.push("/lessons");
        }}
        onCancel={() => setExitConfirmVisible(false)}
      />
      <Progressheader
        progress={progress}
        currentCount={currentQuestionIndex + 1}
        totalCount={questions.length}
        onClose={() => setExitConfirmVisible(true)}
      />

      {/* Main Content */}

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.audioSection,
            {
              backgroundColor: "#f9fafb",
              minHeight: audioSectionAnimHeight,
              flex: hasListedToAudio ? 0 : 1,
              justifyContent: "center",
              opacity: isLoading || showResults ? 0.6 : 1,
            },
          ]}
          pointerEvents={isLoading || showResults ? "none" : "auto"}
        >
          <AudioPrompt
            isPlaying={isSpeechPlaying}
            isRecognizing={isRecognazing}
            hasListedToAudio={hasListedToAudio}
            onPlay={playAudio}
            onStartRecord={() => {}}
            onStopRecord={() => {}}
            onRevealEnglish={handleRevealEnglish}
            currentQuestion={currentQuestion}
            showEnglish={showEnglish}
            selectedOption={selectedOption}
            scaleAnim={scaleAnim}
            instructionOpacity={instructionOpacity}
            listinigOpacity={listinigOpacity}
            listinigScale={listinigScale}
            fadeAnim={fadeAnim}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  audioSection: {
    alignItems: "center",
    marginBottom: 40,
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
  },
  optionsSection: {
    flex: 1,
    marginBottom: 30,
  },
  bottomSection: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  feedbackWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1000,
  },
});
