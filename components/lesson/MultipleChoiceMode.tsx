import { SpeakingOptions } from "@/constants/CourseData";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import {
    Animated,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { ThemedText } from "../ThemedText";

export default function MultipleChoiceMode({
  options,
  selectedOption,
  handleOptionPress,
  optionSelectionAnim,
  isLoading,
  showResults,
}: {
  options: SpeakingOptions[];
  selectedOption: number | null;
  handleOptionPress: (id: number) => void;
  optionSelectionAnim: Animated.Value;
  isLoading: boolean;
  showResults: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.promptContainer}>
        <Animated.View
          style={{
            opacity: optionSelectionAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            transform: [
              {
                translateY: optionSelectionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          }}
        >
          <ThemedText style={styles.sectionTitle} type="subtitle">
            Choisissez votre réponse
          </ThemedText>
        </Animated.View>
        <Animated.View
          style={[
            styles.sayItPromptContainer,
            {
              opacity: optionSelectionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              transform: [
                {
                  translateY: optionSelectionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ThemedText style={styles.sayItPrompt} type="subtitle">
            Maintenant dites-le en anglais
          </ThemedText>
        </Animated.View>
      </View>
      <ScrollView
        style={styles.optionsScrollView}
        contentContainerStyle={styles.optionsContentContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isLoading && !showResults}
      >
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const optionStyle = {
            opacity: Animated.multiply(
              optionSelectionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, isSelected ? 1 : 0.4],
              }),
              isLoading || showResults ? 0.5 : 1,
            ),
            transform: [
              {
                scale: optionSelectionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, isSelected ? 1 : 0.95],
                }),
              },
            ],
          };

          return (
            <Animated.View
              key={option.id}
              style={[styles.optionContainer, optionStyle]}
            >
              <Pressable
                style={[
                  styles.optionButton,
                  isSelected && styles.selectedOption,
                  {
                    backgroundColor: "#ffffff",
                    borderColor: isSelected
                      ? Colors.primaryAccentColor
                      : "#e5e7be",
                    opacity: isLoading || showResults ? 0.7 : 1,
                  },
                ]}
                onPress={() => handleOptionPress(option.id)}
                disabled={isLoading || showResults}
              >
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionText}>
                    {option.french}
                  </ThemedText>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons
                        name="mic-outline"
                        size={20}
                        color={Colors.primaryAccentColor}
                      />
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 20,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  promptContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 50,
  },
  sayItPromptContainer: {
    position: "absolute",
    bottom: 20,
  },
  sayItPrompt: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primaryAccentColor,
    textAlign: "center",
  },
  optionsScrollView: {
    flex: 1,
  },
  optionsContentContainer: {
    paddingBottom: 0,
  },
  optionContainer: {
    marginBottom: 16,
  },
  optionButton: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "visible",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  selectedOption: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.2,
      },
      android: {
        borderWidth: 3,
      },
    }),
  },
  optionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  selectedIndicator: {
    marginLeft: 12,
  },
});
