import { Question, Word } from "@/constants/CourseData";
import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";
import ConfirmDialog from "../ui/ConfirmDialog";
import FlashCard from "./FlashCard";
import Progressheader from "./ProgressHeader";

interface StudyCard {
  key: string;
  word: Word;
  direction: "fr-en" | "en-fr";
}

interface DeckBucket {
  recognition: StudyCard[];
  call: StudyCard[];
  total: number;
}

type StudyPhase = "recognition" | "recall";

interface StudyState {
  phase: StudyPhase;
  queue: string[];
  recallKey: string[];
  cards: Record<string, StudyCard>;
  total: number;
  completed: number;
}

const getUniqueWord = (questions: Question[]): Word[] => {
  const allWords = new Map<string, Word>();

  questions.forEach((question) => {
    const wordSource =
      question.type === "listening_mc"
        ? question.english.words
        : question.options.flatMap((opt) => opt.english.words);

    wordSource.forEach((word) => {
      if (word && word.characters && !allWords.has(word.characters)) {
        allWords.set(word.characters, word);
      }
    });
  });

  return Array.from(allWords.values());
};

const buildDeck = (words: Word[]): DeckBucket => {
  const recognition: StudyCard[] = words.map((word) => ({
    key: `${word.characters}-reconnaissance`,
    word,
    direction: "en-fr",
  }));

  const recall: StudyCard[] = words.map((word) => ({
    key: `${word.characters}-rappele`,
    word,
    direction: "fr-en",
  }));

  return {
    recognition,
    call: recall,
    total: recognition.length + recall.length,
  };
};

const initializedStudyState = (deck: DeckBucket): StudyState => {
  const cards: Record<string, StudyCard> = {};
  [...deck.recognition, ...deck.call].forEach((entry) => {
    cards[entry.key] = entry;
  });

  return {
    phase: "recognition",
    queue: deck.recognition.map((entry) => entry.key),
    recallKey: deck.call.map((entry) => entry.key),
    cards,
    total: deck.total,
    completed: 0,
  };
};

const VocabularyIntroScreen = ({
  questions,
  onStartLesson,
}: {
  questions: Question[];
  onStartLesson: () => void;
}) => {
  const vocabulary = useMemo(() => getUniqueWord(questions), [questions]);
  const deck = useMemo(() => buildDeck(vocabulary), [vocabulary]);
  const [state, setState] = useState<StudyState>(() =>
    initializedStudyState(deck),
  );

  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);

  const handleGrade = useCallback((grade: "again" | "good") => {
    setState((prev) => {
      if (prev.queue.length === 0) {
        return prev;
      }

      const [activeKey, ...restQueue] = prev.queue;
      const entry = prev.cards[activeKey];

      if (!entry) {
        return { ...prev, queue: restQueue };
      }

      let queue = [...restQueue];
      let completed = prev.completed;
      let recallKey = prev.recallKey;
      let phase: StudyPhase = prev.phase;

      if (grade === "again") {
        const insertIndex = Math.min(2, queue.length);
        queue.splice(insertIndex, 0, activeKey);
      } else {
        completed = Math.min(prev.completed + 1, prev.total);
      }

      if (
        queue.length === 0 &&
        phase === "recognition" &&
        recallKey.length > 0
      ) {
        queue = [...recallKey];
        recallKey = [];
        phase = "recall";
      }

      return {
        ...prev,
        queue,
        recallKey,
        phase,
        completed,
      };
    });
  }, []);

  useEffect(() => {
    if (
      state.queue.length === 0 &&
      state.recallKey.length === 0 &&
      state.completed >= state.total
    ) {
      onStartLesson();
    }
  }, [
    state.queue.length,
    state.recallKey.length,
    state.completed,
    state.total,
    onStartLesson,
  ]);

  if (deck.total === 0) {
    onStartLesson();
    return null;
  }

  const progressPercent =
    state.total === 0 ? 0 : (state.completed / state.total) * 100;

  const currentKey = state.queue[0];
  const currentCard = currentKey ? state.cards[currentKey] : undefined;
  const headerCount = currentCard
    ? Math.min(state.completed + 1, state.total)
    : state.completed;

  return (
    <View style={styles.container}>
      <ConfirmDialog
        visible={exitConfirmVisible}
        title="Quitter la leçon"
        description="Êtes-vous sûr de vouloir quitter cette leçon ? Tout progrès non sauvegardé sera perdu!"
        confirmLabel="Quitter"
        cancelLabel="Annuler"
        destructive
        onCancel={() => setExitConfirmVisible(false)}
        onConfirm={() => {
          setExitConfirmVisible(false);
          router.push("/lessons");
        }}
      />
      <Progressheader
        progress={progressPercent}
        currentCount={headerCount}
        totalCount={state.total}
        onClose={() => setExitConfirmVisible(true)}
      />

      <View style={styles.content}>
        <View style={styles.instructionContainer}>
          <ThemedText style={styles.instructionTitle}>
            Leçon de vocabulaire
          </ThemedText>
          <ThemedText style={styles.instructionText}>
            Appuyez pour retourner la carte que vous devez examiner
          </ThemedText>
        </View>

        {currentCard ? (
          <View style={styles.flashcardContainer}>
            <FlashCard
              key={currentKey}
              word={currentCard.word}
              direction={currentCard.direction}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.bottomActions}>
        <View style={styles.gradeButtons}>
          <Pressable
            onPress={() => handleGrade("again")}
            disabled={!currentCard}
            style={({ pressed }) => [
              styles.gradeButton,
              styles.againButton,
              !currentCard ? styles.disabledButton : null,
              pressed && !!currentCard ? styles.pressedButton : null,
            ]}
          >
            <ThemedText style={styles.gradeButtonText}>Réessayer</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => handleGrade("good")}
            disabled={!currentCard}
            style={({ pressed }) => [
              styles.gradeButton,
              styles.gotItButton,
              !currentCard ? styles.disabledButton : null,
              pressed && !!currentCard ? styles.pressedButton : null,
            ]}
          >
            <ThemedText style={styles.gradeButtonTextWhite}>Trouvé</ThemedText>
          </Pressable>
        </View>

        <Pressable
          onPress={onStartLesson}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.skipButtonPressed,
          ]}
        >
          <ThemedText style={styles.skipButtonText}>Passer la leçon</ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  instructionContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 15,
    color: Colors.subduedTextColor,
    textAlign: "center",
    lineHeight: 22,
  },
  flashcardContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  bottomActions: {
    marginTop: "auto",
    paddingTop: 16,
    gap: 16,
    paddingLeft: 16,
    paddingRight: 16,
  },
  gradeButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  gradeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  againButton: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },
  gotItButton: {
    backgroundColor: Colors.primaryAccentColor,
    borderColor: Colors.primaryAccentColor,
  },
  disabledButton: {
    opacity: 0.4,
  },
  pressedButton: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  gradeButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#374151",
  },
  gradeButtonTextWhite: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  skipButton: {
    width: "100%",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonPressed: {
    opacity: 0.6,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.subduedTextColor,
  },
});

export default VocabularyIntroScreen;
