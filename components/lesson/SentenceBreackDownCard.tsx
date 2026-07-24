import { EnglishPhrases, Word } from "@/constants/CourseData";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import {
    Gesture,
    GestureDetector,
    ScrollView,
} from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "../ThemedText";

interface ToolTipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
  width: number;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const CARD_MAX_HEIGHT = SCREEN_HEIGHT * 0.75;
const CARD_MIN_HEIGHT = 90;
const OPEN_POSITION = 0;
const CLOSED_POSITION = CARD_MAX_HEIGHT - CARD_MIN_HEIGHT;

export default function SentenceBreackDownCard({
  sentence,
  disabled,
}: {
  sentence: {
    french: string;
    english: EnglishPhrases;
    breakdown: string;
  };
  disabled?: boolean;
}) {
  "use no memo";
  const insets = useSafeAreaInsets();
  const transaleY = useSharedValue(CLOSED_POSITION);
  const contextY = useSharedValue(0);
  const toolTipWidthRef = useRef<number>(0);
  const [toolTip, setToolTip] = useState<ToolTipState | null>(null);
  const englishWordRefs = useRef<Array<View | null>>([]);
  const cardRef = useRef<Animated.View>(null);
  const [selectedWord, setSelectedWord] = useState<{
    type: "characters";
    index: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: transaleY.value }],
    };
  });

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const closeCard = () => {
    "worklet";
    transaleY.value = withSpring(CLOSED_POSITION, {
      damping: 30,
      stiffness: 200,
      mass: 1,
    });
  };

  const openCard = () => {
    "worklet";
    transaleY.value = withSpring(OPEN_POSITION, {
      damping: 30,
      stiffness: 200,
      mass: 1,
    });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = transaleY.value;
    })
    .onUpdate((event) => {
      transaleY.value = contextY.value + event.translationY;
      transaleY.value = Math.max(transaleY.value, OPEN_POSITION);
    })
    .onEnd(() => {
      if (transaleY.value > CLOSED_POSITION / 2) {
        closeCard();
      } else {
        openCard();
      }
    });

  const handleSpeechEnd = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const hideTooltip = () => {
    setToolTip(null);
    setSelectedWord(null);
  };

  const playAudio = useCallback(() => {
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
      return;
    }

    const text = sentence.english.words
      .map((word: Word) => word.characters)
      .join(" ");
    if (!text) return;

    setIsPlaying(true);
    Speech.speak(text, {
      language: "en-EN",
      onDone: handleSpeechEnd,
      onStopped: handleSpeechEnd,
      onError: handleSpeechEnd,
    });
  }, [isPlaying, sentence.english.words, handleSpeechEnd]);

  const showTooltipe = (word: Word, type: "characters", index: number) => {
    const wordRef =
      type === "characters" ? englishWordRefs.current[index] : null;

    if (!wordRef) return;

    wordRef.measureInWindow((wordX, wordY, wordWidth) => {
      cardRef.current?.measureInWindow((cardX, cardY) => {
        setToolTip({
          visible: true,
          text: word.french,
          x: wordX + wordWidth / 2,
          y: wordY - cardY,
          width: wordWidth,
        });

        setSelectedWord({ type, index });
      });
    });
  }; // ← IL MANQUE CETTE ACCOLADE

  const renderInteractiveSentence = (type: "characters") => (
    <Pressable onPress={hideTooltip}>
      <View style={styles.interactiveSentenceContainer}>
        {sentence.english.words.map((word: Word, index: number) => (
          <Pressable
            key={index}
            ref={(ref) => {
              if (type === "characters") englishWordRefs.current[index] = ref;
              else englishWordRefs.current[index] = null;
            }}
            onPress={() => showTooltipe(word, type, index)}
          >
            <ThemedText
              style={[
                styles.englishValue,
                selectedWord &&
                  selectedWord.type === type &&
                  selectedWord.index === index &&
                  styles.selectedWord,
              ]}
            >
              {word.characters}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </Pressable>
  );

  const cardInner = (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          height: CARD_MAX_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          opacity: disabled ? 0.6 : 1,
        },
        animatedStyle,
      ]}
      ref={cardRef}
      pointerEvents={disabled ? "none" : "auto"}
    >
      <Pressable style={{ flex: 1 }} onPress={hideTooltip}>
        <Pressable
          onPress={() => {
            if (transaleY.value === OPEN_POSITION) {
              closeCard();
            } else {
              openCard();
            }
          }}
          style={styles.handleContainer}
        >
          <View style={styles.handle}></View>
        </Pressable>

        <View style={styles.peekContent}>
          <Ionicons name="help-circle-outline" size={24} color="#9ca3af" />
          <ThemedText style={styles.peekText}>
            Balayez vers le haut pour plus d'aide
          </ThemedText>
        </View>

        <ScrollView
          style={styles.fullContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={styles.title}>Analyse de la phrase</ThemedText>

          <View style={styles.wordHintContainer}>
            <ThemedText style={styles.wordHintText}>
              Appuyez sur le mot pour voir sa signification
            </ThemedText>
          </View>

          <View style={styles.breakdownItem}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ThemedText style={styles.label}>Mot: </ThemedText>
              <Pressable
                onPress={playAudio}
                style={styles.playButton}
                hitSlop={8}
                disabled={disabled}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={20}
                  color={Colors.primaryAccentColor}
                />
              </Pressable>
            </View>
            {renderInteractiveSentence("characters")}
          </View>
          <View style={styles.breakdownItem}>
            <ThemedText style={styles.label}>Signification:</ThemedText>
            <ThemedText style={styles.frenchValue}>
              {sentence.french}
            </ThemedText>
          </View>
          <View style={styles.breakdownItem}>
            <ThemedText style={styles.label}>Analyse:</ThemedText>
            <ThemedText style={styles.breakdownText}>
              {sentence.breakdown}
            </ThemedText>
          </View>
        </ScrollView>
      </Pressable>

      {toolTip?.visible && (
        <View
          style={[
            styles.tooltipContainer,
            {
              top: toolTip.y - 48,
              left: Math.max(
                8,
                Math.min(
                  toolTip.x - toolTipWidthRef.current / 2,
                  SCREEN_WIDTH - toolTipWidthRef.current - 8,
                ),
              ),
            },
          ]}
          onLayout={(e) => {
            toolTipWidthRef.current = e.nativeEvent.layout.width;
          }}
        >
          <ThemedText style={styles.tooltipText}>{toolTip.text}</ThemedText>
        </View>
      )}
    </Animated.View>
  );

  if (disabled) {
    return cardInner;
  }

  return <GestureDetector gesture={panGesture}>{cardInner}</GestureDetector>;
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "absolute",
    bottom: -CARD_MIN_HEIGHT,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8, // lowered so it sits behind the result
    zIndex: 0, // ensure this is lower than the result overlay
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#e5e7eb",
  },
  peekContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
  },
  peekText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.subduedTextColor, // Gray-500
    fontWeight: "500",
  },
  fullContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1c1c1e", // Dark text
    marginBottom: 5,
  },
  breakdownItem: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    color: Colors.subduedTextColor, // Gray-500
    textTransform: "uppercase",
  },
  interactiveSentenceContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  englishValue: {
    fontSize: 18,
    color: "#1c1c1e",
    fontWeight: "600",
    lineHeight: 30,
  },
  frenchValue: {
    fontSize: 18,
    color: "#1c1c1e",
    lineHeight: 26,
  },
  breakdownText: {
    fontSize: 16,
    color: "#1c1c1e",
    lineHeight: 24,
  },
  tooltipContainer: {
    position: "absolute",
    backgroundColor: "#f3f4f6", // Light gray
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tooltipText: {
    color: "#1c1c1e",
    fontSize: 14,
    textAlign: "center",
  },
  selectedWord: {
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 2,
    textDecorationLine: "underline",
    textDecorationColor: Colors.primaryAccentColor,
    textDecorationStyle: "solid",
  },
  wordHintContainer: {
    marginBottom: 20,
  },
  wordHintText: {
    fontSize: 13,
    color: Colors.subduedTextColor,
    fontStyle: "italic",
  },
  playButton: {
    marginLeft: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "#ffe0d2",
    justifyContent: "center",
    alignItems: "center",
  },
});
