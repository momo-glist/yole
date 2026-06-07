import { Question, SpeakingOptions } from "@/constants/CourseData";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import {
  recordQuestionAnswered,
  recordQuestionListened,
} from "@/utils/speakingListiningStats";
import { FunctionsHttpError } from "@supabase/functions-js";
import { Audio, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  View,
} from "react-native";
import { compareTwoStrings } from "string-similarity";
import { ThemedText } from "../ThemedText";
import ConfirmDialog from "../ui/ConfirmDialog";
import AudioPrompt from "./AudioPrompt";
import FeedBackView from "./FeedBackView";
import ListeningMultipleChhoiceMode from "./ListeningMultipleChoiceMode";
import MultipleChoiceMode from "./MultipleChoiceMode";
import Progressheader from "./ProgressHeader";
import SingleResponseModal from "./SingleResponseModal";

interface WrongQuestion {
  french: string;
  english: {
    characters: string;
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

  const selectedSentences = useMemo((): SpeakingOptions | null => {
    if (currentQuestion.type === "listening_mc") {
      if (showResults) {
        const correctFrench =
          currentQuestion.options.find(
            (option) => option.id === currentQuestion.correctOptionId,
          )?.french || "";
        return {
          id: currentQuestion.id,
          french: correctFrench,
          english: {
            ...currentQuestion.english,
          },
        };
      }
      return null;
    }

    if (!selectedOption) return null;
    return currentQuestion.options.find(
      (option) => option.id === selectedOption,
    )!;
  }, [selectedOption, currentQuestion, showResults]);

  useEffect(() => {
    return () => {
      Speech.stop();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (showResults) {
      if (isCorrect) {
        if (
          attempCount === 0 ||
          (attempCount > 0 && wrongQuestions.has(currentQuestion.id))
        ) {
          setCorrectAnswersCount((prev) => prev + 1);
        } else {
          setQuestionAttempts((prev) => ({
            ...prev,
            [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1,
          }));
        }

        if (attempCount === 0) {
          setWrongQuestions((prev) => new Set(prev).add(currentQuestion.id));
        }
      }
    }
  }, [showResults, isCorrect, attempCount, currentQuestion.id]);

  useEffect(() => {
    Speech.stop();
    setIsSpeechPlaying(false);
  }, [currentQuestion]);

  useEffect(() => {
    if (isSpeechPlaying && !hasStartedFirstPlay && !hasListedToAudio) {
      setHasStartedFirstPlay(true);
      Animated.parallel([
        Animated.timing(instructionOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(listinigOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(listinigScale, {
            toValue: 1.05,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(listinigScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isSpeechPlaying, hasStartedFirstPlay, hasListedToAudio]);

  useEffect(() => {
    if (
      currentQuestion.type === "single_response" &&
      currentQuestion.options.length > 0 &&
      hasListedToAudio
    ) {
      setSelectedOption(currentQuestion.options[0].id);
      Animated.timing(optionSelectionAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentQuestion, hasListedToAudio]);

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

  const startRecording = async () => {
    if (isSpeechPlaying) {
      Speech.stop();
      setIsSpeechPlaying(false);
    }

    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("l'accès au microphone est requis");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        staysActiveInBackground: true,
      });

      const preset = Audio.RecordingOptionsPresets.HIGH_QUALITY;
      const { recording } = await Audio.Recording.createAsync({
        ...preset,
        android: {
          ...preset.android,
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
        },
        ios: {
          ...preset.ios,
          extension: ".wav",
          audioQuality: Audio.IOSAudioQuality.MAX,
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
        },
      });
      recordingRef.current = recording;
      setIsRecognazing(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      recordingRef.current = null;
      setIsRecognazing(false);
      Alert.alert("Impossible de debuter l'enregistrement");
    }
  };

  const proceesSpeechResult = (transcript: string) => {
    setIsLoading(false);
    setShowResults(true);

    const punctuationRegex = /[.,\/#!$%\^&\*;:{}=\-_`~()?]/g;
    const rawExpected = selectedSentences?.english.characters || "";
    const expected = rawExpected
      .toLowerCase()
      .replace(punctuationRegex, "")
      .replace(/\s+/g, "")
      .trim();

    const said = transcript
      .toLowerCase()
      .replace(punctuationRegex, "")
      .replace(/\s+/g, "")
      .trim();

    setTranscription({ expected: rawExpected, said: transcript });

    if (!said || !expected) {
      setIsCorrect(false);
    } else {
      const similarity = compareTwoStrings(expected, said);
      const isSimilarEnough = similarity >= 0.8;
      setIsCorrect(isSimilarEnough);
      if (isSimilarEnough) {
        void recordQuestionAnswered();
      }
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const stopRecording = async () => {
    setIsLoading(true);
    setIsRecognazing(false);

    try {
      const recording = recordingRef.current;

      if (!recording) {
        setIsLoading(false);
        return;
      }

      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();

      recordingRef.current = null;

      if (!uri) {
        setIsLoading(false);
        Alert.alert("Aucun audio n'a été enregistré");
        return;
      }

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { data, error } = await supabase.functions.invoke("transcriber", {
        body: {
          inputAudio: {
            data: base64Audio,
            format: "wav",
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.transcript) {
        proceesSpeechResult(data.transcript);
      } else {
        throw new Error("No transcript found");
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);

      if (error instanceof FunctionsHttpError) {
        const errorResponse = await error.context.json();
        console.log("EDGE ERROR:", errorResponse);
      }

      setIsLoading(false);
      Alert.alert("Erreur de transcription");
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuestionState = () => {
    Speech.stop();
    setIsSpeechPlaying(false);
    setShowEnglish(false);
    setSelectedOption(null);
    setIsLoading(false);
    setShowResults(false);
    setHasListedToAudio(false);
    setHasStartedFirstPlay(false);
    setIsRecognazing(false);
    fadeAnim.setValue(0);
    scaleAnim.setValue(1);
    optionAnimationValue.setValue(0);
    optionSelectionAnim.setValue(0);
    audioSectionAnimHeight.setValue(400);
    instructionOpacity.setValue(1);
    listinigOpacity.setValue(0);
    listinigScale.setValue(0.95);
  };

  const nextQuestion = () => {
    Animated.timing(audioSectionAnimHeight, {
      toValue: 400,
      duration: 500,
      useNativeDriver: false,
    }).start(() => {
      if (currentQuestionIndex < questions.length - 1) {
        resetState();
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      {
        const accuracy = Math.round(
          (correctAnswersCount / questions.length) * 100,
        );

        const wrongQuestionList = questions
          .filter((q) => wrongQuestions.has(q.id))
          .map((q) => {
            let french = "";
            let characters = "";

            if (q.type === "listening_mc") {
              french =
                q.options.find((opt) => opt.id === q.correctOptionId)?.french ||
                "";
              characters = q.english.characters;
            }
            {
              const option = q.options[0];
              french = option.french;
              characters = option.english.characters;
            }

            return {
              french,
              english: {
                characters,
              },
              attempts: questionAttempts[q.id] || 0,
            };
          });

        const finalStats: LessonStats = {
          correctAnswers: correctAnswersCount,
          totalQuestions: questions.length,
          accuracy,
          wrongQuestions:
            wrongQuestionList.length > 0 ? wrongQuestionList : undefined,
        };

        setLessonStats(finalStats);
        setShowCompletScreen(true);
      }
    });
  };

  const resetState = () => {
    setShowEnglish(false);
    setSelectedOption(null);
    setShowResults(false);
    setHasListedToAudio(false);
    setAttemptCount(0);
    setIsLoading(false);
    setTranscription(null);
    Speech.stop();
    setIsSpeechPlaying(false);
    setHasStartedFirstPlay(false);
    fadeAnim.setValue(0);
    scaleAnim.setValue(1);
    optionAnimationValue.setValue(0);
    optionSelectionAnim.setValue(0);
    instructionOpacity.setValue(1);
    listinigOpacity.setValue(0);
    listinigScale.setValue(0.95);
    setHasStartedFirstPlay(false);
  };

  if (showCompletScreen && lessonStats) {
    return;
  }

  const goToNextQuestion = () => {
    const nextQuestionIndex = currentQuestionIndex + 1;

    if (nextQuestionIndex >= questions.length) {
      router.push("/lessons");
      return;
    }

    resetQuestionState();
    setCurrentQuestionIndex(nextQuestionIndex);
  };

  const handleOptionPress = (id: number) => {
    if (currentQuestion.type === "listening_mc") {
      setSelectedOption(id);
      setIsCorrect(id === currentQuestion.correctOptionId);
      setShowResults(true);
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    const isDeselecting = selectedOption === id;
    const newSelectedOption = isDeselecting ? null : id;
    setSelectedOption(newSelectedOption);
    Animated.timing(optionSelectionAnim, {
      toValue: isDeselecting ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
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
        onConfirm={async () => {
          setExitConfirmVisible(false);

          Speech.stop();

          if (recordingRef.current) {
            try {
              await recordingRef.current.stopAndUnloadAsync();
            } catch {}

            recordingRef.current = null;
          }

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
            onStartRecord={startRecording}
            onStopRecord={stopRecording}
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

        {hasListedToAudio && (
          <Animated.View
            style={[
              styles.optionsSection,
              {
                opacity: Animated.multiply(
                  optionAnimationValue,
                  isLoading || showResults ? 0.5 : 1,
                ),
                transform: [
                  {
                    translateY: optionAnimationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents={isLoading || showResults ? "none" : "auto"}
          >
            {currentQuestion.type === "multiple_choice" && (
              <MultipleChoiceMode
                options={currentQuestion.options}
                selectedOption={selectedOption}
                handleOptionPress={handleOptionPress}
                optionSelectionAnim={optionSelectionAnim}
                isLoading={isLoading}
                showResults={showResults}
              />
            )}
            {currentQuestion.type === "listening_mc" && (
              <ListeningMultipleChhoiceMode
                options={currentQuestion.options}
                selectedOption={selectedOption}
                handleOptionPress={handleOptionPress}
                isLoading={isLoading}
                showResults={showResults}
              />
            )}
            {currentQuestion.type === "single_response" && (
              <SingleResponseModal
                option={currentQuestion.options[0]}
                optionSelectionAnim={optionSelectionAnim}
              />
            )}
          </Animated.View>
        )}

        {isLoading && (
          <View style={styles.bottomSection}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={Colors.primaryAccentColor}
              />
              <ThemedText
                style={[styles.loadingText, { color: Colors.subduedTextColor }]}
              >
                Analyse de ta prononciation
              </ThemedText>
            </View>
          </View>
        )}

        {/* FeedBack View */}

        {showResults && selectedSentences && (
          <Animated.View
            style={[
              styles.feedbackWrapper,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <FeedBackView
              correctOption={selectedSentences}
              isCorrect={isCorrect}
              onContinue={goToNextQuestion}
              onRetry={resetQuestionState}
              attempCount={isCorrect ? attempCount : attempCount + 1}
              maxAttempt={3}
              transcription={
                transcription
                  ? {
                      expected: transcription.expected,
                      said: transcription.said,
                    }
                  : undefined
              }
            />
          </Animated.View>
        )}
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
