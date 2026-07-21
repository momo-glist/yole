import { SpeakingOptions } from "@/constants/CourseData";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";

export default function FeedBackView({
  correctOption,
  isCorrect,
  onContinue,
  onRetry,
  attempCount,
  maxAttempt,
  transcription,
}: {
  correctOption: SpeakingOptions;
  isCorrect: boolean | null;
  onContinue: () => void;
  onRetry?: () => void;
  attempCount: number;
  maxAttempt: number;
  transcription?: {
    expected: string;
    said: string;
  };
}) {
  const showRetryButton = onRetry && !isCorrect && attempCount < maxAttempt;
  const showCorrectAnswer = !isCorrect && attempCount >= maxAttempt;
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isCorrect ? "#e8f5e9" : "#ffebee",
          borderColor: isCorrect ? "#34C759" : "#ffebee",
        },
      ]}
    >
      <View style={styles.header}>
        <Ionicons
          name={isCorrect ? "checkmark-circle" : "close-circle"}
          size={40}
          color={isCorrect ? "#34C759" : "#f44336"}
        />
        <ThemedText style={styles.title}>
          {isCorrect
            ? "Bonne réponse"
            : showRetryButton
              ? "Mauvaise réponse"
              : "Fin de la leçon"}
        </ThemedText>
        {!isCorrect && showRetryButton && (
          <ThemedText
            style={[styles.subtitle, { color: Colors.subduedTextColor }]}
          >
            Recommencez
          </ThemedText>
        )}
        {showCorrectAnswer && (
          <ThemedText
            style={[styles.subtitle, { color: Colors.subduedTextColor }]}
          >
            Voici ce que vous devrez dire la prochaine fois
          </ThemedText>
        )}
      </View>
      {/* Transcription feedback */}

      {transcription && (
        <View style={styles.transcriptionContainer}>
          <View style={styles.transcriptionRow}>
            <ThemedText style={styles.transcriptionLabel}>Attendu:</ThemedText>
            <ThemedText style={styles.transcriptionText}>
              {transcription.expected}
            </ThemedText>
          </View>
          <View style={styles.transcriptionRow}>
            <ThemedText style={styles.transcriptionLabel}>
              tu as dis:
            </ThemedText>
            <ThemedText
              style={[
                styles.transcriptionText,
                { color: isCorrect ? "#34C759" : "#f44336" },
              ]}
            >
              {transcription.said.charAt(0).toUpperCase() +
                transcription.said.slice(1)}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Show correct Answer after max attempt */}
      {showCorrectAnswer && (
        <View style={styles.correctAnswerSection}>
          <View style={styles.correctAnswerHeader}>
            <Ionicons
              name="bulb-outline"
              size={20}
              color={Colors.primaryAccentColor}
            />
            <ThemedText style={styles.correctAnswerLabel}>
              {" "}
              La reponse :{" "}
            </ThemedText>
          </View>
          <View style={styles.correctAnswerContent}>
            <ThemedText style={styles.correctAnswerFrench}>
              {correctOption.french}
            </ThemedText>
            <View style={styles.correctAnswerEnglish}>
              <ThemedText style={styles.correctAnswerCharacters}>
                {correctOption.english.characters}
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Action button */}
      <View style={styles.buttonContainer}>
        {showRetryButton ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={onRetry}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <ThemedText style={styles.retryButtonText}>
                essaye de nouveau, il te reste {maxAttempt - attempCount}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.skipButton,
                { borderColor: Colors.subduedTextColor },
              ]}
              onPress={onContinue}
            >
              <ThemedText
                style={[
                  styles.skipButtonText,
                  { color: Colors.subduedTextColor },
                ]}
              >
                Passer
              </ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.continueButton]}
            onPress={onContinue}
          >
            <ThemedText style={[styles.continueButtonText]}>
              {isCorrect ? "continue" : "Question suivante"}
            </ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Attempt indicator */}
      {!isCorrect && attempCount > 0 && attempCount < maxAttempt && (
        <View style={styles.attemptIndicator}>
          <View style={styles.attemptDots}>
            {Array.from({ length: maxAttempt }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.attemptDot,
                  {
                    backgroundColor:
                      i < attempCount ? "#ef4444" : "rgba(107, 114, 128, 0.3)",
                  },
                ]}
              ></View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  correctAnswerSection: {
    backgroundColor: "rgba(255, 73, 0, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 73, 0, 0.3)",
  },
  correctAnswerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  correctAnswerLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    color: Colors.primaryAccentColor,
  },
  correctAnswerContent: {
    gap: 8,
  },
  correctAnswerFrench: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  correctAnswerEnglish: {
    gap: 4,
  },
  correctAnswerCharacters: {
    fontSize: 18,
    fontWeight: "700",
  },
  correctAnswerHanzi: {
    fontSize: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  retryButton: {
    backgroundColor: Colors.primaryAccentColor,
    shadowColor: Colors.primaryAccentColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  skipButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  continueButton: {
    backgroundColor: Colors.primaryAccentColor,
    shadowColor: Colors.primaryAccentColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  attemptIndicator: {
    marginTop: 16,
    alignItems: "center",
  },
  attemptDots: {
    flexDirection: "row",
    gap: 8,
  },
  attemptDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  transcriptionContainer: {
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 8,
    marginBottom: 12,
  },
  transcriptionRow: {
    flexDirection: "row",
  },
  transcriptionLabel: {
    width: 80,
    fontSize: 14,
    color: Colors.subduedTextColor,
    fontWeight: "600",
  },
  transcriptionText: {
    flex: 1,
    fontSize: 14,
  },
});
