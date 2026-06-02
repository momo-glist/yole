import { Word } from "@/constants/CourseData";
import { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";

export default function FlashCard({
  word,
  direction,
}: {
  word: Word;
  direction: "en-fr" | "fr-en";
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const flipAnimation = useRef(new Animated.Value(0)).current;

  const frontInterPolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backtInterPolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterPolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backtInterPolate }],
  };

  const flipToFront = () => {
    Animated.timing(flipAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setIsFlipped(false);
  };

  const flipToBack = () => {
    Animated.timing(flipAnimation, {
      toValue: 180,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setIsFlipped(true);
  };

  const frontContent = () => {
    if (direction === "fr-en") {
      return <ThemedText style={styles.frenchFront}>{word.french}</ThemedText>;
    }

    return (
      <View style={styles.englishContent}>
        <ThemedText style={styles.characters}>{word.characters}</ThemedText>
        <ThemedText style={styles.ipa}>{word.ipa}</ThemedText>
      </View>
    );
  };

  const backContent = () => {
    if (direction === "fr-en") {
      return (
        <View style={styles.englishContent}>
          <ThemedText style={[styles.characters, styles.englishBackText]}>
            {word.characters}
          </ThemedText>
        </View>
      );
    }

    return (
      <ThemedText style={[styles.frenchBack, styles.englishBackText]}>
        {word.french}
      </ThemedText>
    );
  };

  return (
    <Pressable onPress={isFlipped ? flipToFront : flipToBack}>
      <View>
        <Animated.View
          style={[styles.card, styles.cardFront, frontAnimatedStyle]}
        >
          {/* Front Content */}
          {frontContent()}
        </Animated.View>
        <Animated.View
          style={[styles.card, styles.cardBack, backAnimatedStyle]}
        >
          {/* Back Content */}
          {backContent()}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 340,
    maxHeight: 440,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  cardFront: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardBack: {
    backgroundColor: "#1a1a2e",
    position: "absolute",
    top: 0,
  },
  englishContent: {
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  characters: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: "90%",
  },
  ipa: {
    fontSize: 30,
    lineHeight: 36,
    textAlign: "center",
    maxWidth: "90%",
  },
  englishBackText: {
    color: "white",
  },
  frenchFront: {
    fontSize: 40,
    lineHeight: 48,
    textAlign: "center",
    fontWeight: "600",
    maxWidth: "90%",
  },
  frenchBack: {
    fontSize: 40,
    lineHeight: 48,
    textAlign: "center",
    fontStyle: "italic",
    maxWidth: "90%",
  },
});
