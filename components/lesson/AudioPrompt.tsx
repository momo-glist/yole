import { Question } from "@/constants/CourseData";
import { Colors } from "@/constants/theme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../ThemedText";
import AudioWaveForme from "./AudioWaveForm";

export default function AudioPrompt({
  isPlaying,
  isRecognizing,
  hasListedToAudio,
  onPlay,
  onStartRecord,
  onStopRecord,
  onRevealEnglish,
  currentQuestion,
  showEnglish,
  selectedOption,
  scaleAnim,
  instructionOpacity,
  listinigOpacity,
  listinigScale,
  fadeAnim,
}: {
  isPlaying: boolean;
  isRecognizing: boolean;
  hasListedToAudio: boolean;
  onPlay: () => void;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onRevealEnglish: () => void;
  currentQuestion: Question;
  showEnglish: boolean;
  selectedOption: number | null;
  scaleAnim: Animated.Value;
  instructionOpacity: Animated.Value;
  listinigOpacity: Animated.Value;
  listinigScale: Animated.Value;
  fadeAnim: Animated.Value;
}) {
  const playbackDisabled = !selectedOption && (isPlaying || hasListedToAudio);

  return (
    <>
      <Pressable
        disabled={playbackDisabled}
        onPress={
          selectedOption
            ? isRecognizing
              ? onStopRecord
              : () => requestAnimationFrame(onStartRecord)
            : playbackDisabled
              ? undefined
              : () => requestAnimationFrame(onPlay)
        }
        onPressIn={() => {
          if (playbackDisabled) {
            return;
          }
          Animated.spring(scaleAnim, {
            toValue: 0.9,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          if (playbackDisabled) {
            return;
          }
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }}
      >
        <Animated.View
          style={[
            styles.playButton,
            {
              backgroundColor: selectedOption
                ? isRecognizing
                  ? "#ef4444"
                  : Colors.primaryAccentColor
                : playbackDisabled
                  ? "#ABE7B2"
                  : Colors.primaryAccentColor,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {selectedOption ? (
            isRecognizing ? (
              <MaterialIcons name="stop" size={36} color="white" />
            ) : (
              <Ionicons name="mic" size={36} color="white" />
            )
          ) : isPlaying ? (
            <MaterialIcons name="graphic-eq" size={36} color="white" />
          ) : (
            <Ionicons name="play" size={36} color="white" />
          )}
        </Animated.View>
      </Pressable>
      {selectedOption && isRecognizing ? (
        <View style={styles.recordingStatus}>
          <View style={styles.recordingIndicatorLarge}>
            <View style={styles.recordingDotLarge}></View>
          </View>
          <ThemedText style={styles.recordingText}>
            Enregistrement...
          </ThemedText>
        </View>
      ) : (
        <AudioWaveForme isPlaying={isPlaying} />
      )}
      <View
        style={[
          styles.promptTextContainer,
          { minHeight: currentQuestion.type === "listening_mc" ? 0 : 50 },
        ]}
      >
        {selectedOption ? (
          <View style={styles.recordingPromptTop}>
            <ThemedText style={styles.recordingPromptText}>
              {isRecognizing
                ? "Donnez votre reponse"
                : "Tapez sur le micro pour commencer"}
            </ThemedText>
          </View>
        ) : !hasListedToAudio ? (
          <View style={styles.listeningPrompt}>
            <Animated.View
              style={[
                styles.instructionContainer,
                { opacity: instructionOpacity },
              ]}
            >
              <ThemedText style={[styles.instructionText, { marginBottom: 8 }]}>
                Appuyez sur play pour écouter attentivement
              </ThemedText>
              <ThemedText style={[styles.instructionHint]}>
                L'audio est joué une fois avant chaque réponse
              </ThemedText>
            </Animated.View>
            <Animated.View
              style={[
                styles.listeningContainer,
                {
                  opacity: listinigOpacity,
                  transform: [{ scale: listinigScale }],
                },
              ]}
            >
              <ThemedText style={styles.revealButtonText}>Ecoute...</ThemedText>
            </Animated.View>
          </View>
        ) : showEnglish ? (
          <TouchableOpacity onPress={onRevealEnglish}>
            <Animated.View style={[styles.englishText, { opacity: fadeAnim }]}>
              <ThemedText style={styles.characters}>
                {currentQuestion.english.characters}
              </ThemedText>
            </Animated.View>
          </TouchableOpacity>
        ) : (
          currentQuestion.type !== "listening_mc" && (
            <TouchableOpacity
              style={styles.revealButton}
              onPress={onRevealEnglish}
              hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
            >
              <ThemedText style={styles.instructionText}>
                Appuyer pour voir ce qui a été dit
              </ThemedText>
            </TouchableOpacity>
          )
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryAccentColor,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
    }),
  },
  englishText: {
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  characters: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  hanzi: {
    fontSize: 18,
  },
  revealButton: {
    marginBottom: 8,
    marginTop: 16,
    alignItems: "center",
  },
  revealButtonText: {
    fontSize: 16,
    color: Colors.subduedTextColor,
    marginBottom: 4,
  },
  recordingStatus: {
    alignItems: "center",
    marginVertical: 16,
  },
  recordingIndicatorLarge: {
    marginBottom: 8,
  },
  recordingDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ef4444",
  },
  recordingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  promptTextContainer: {
    alignItems: "center",
  },
  recordingPromptTop: {
    alignItems: "center",
    padding: 12,
  },
  recordingPromptText: {
    fontSize: 16,
    color: Colors.subduedTextColor,
    textAlign: "center",
  },
  listeningPrompt: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    minHeight: 60,
  },
  instructionContainer: {
    alignItems: "center",
  },
  listeningContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionText: {
    fontSize: 16,
    textAlign: "center",
    color: Colors.subduedTextColor,
  },
  instructionHint: {
    fontSize: 14,
    textAlign: "center",
    color: "#9ca3af",
  },
});
