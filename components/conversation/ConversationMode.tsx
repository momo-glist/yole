import { conversationScenario } from "@/constants/CourseData";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { recordConversationTurn } from "@/utils/speakingListiningStats";
import { Ionicons } from "@expo/vector-icons";
import { Audio, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "../ThemedText";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  french?: string;
}

export default function ConversationMode({
  scenario,
  onExit,
}: {
  scenario: conversationScenario;
  onExit: () => void;
}) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [inputText, setInputText] = useState("");
  const lastSpokenAssitantMessageId = useRef<string | null>(null);
  const confettiRef = useRef<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      text: "Hello!",
      french: "Salut!",
    },
  ]);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      console.log("Cleanup useEffect running, recordingRef.current:", recordingRef.current);
      Speech.stop();
      if (recordingRef.current) {
        recordingRef.current.getStatusAsync().then((status) => {
          if (status.isRecording || status.canRecord) {
            recordingRef.current?.stopAndUnloadAsync().catch(() => {
              // Ignore errors during cleanup
            });
          }
          recordingRef.current = null;
        }).catch(() => {
          recordingRef.current = null;
        });
      }
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handlePlayAudio = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: "en-En" });
  };

  const callChatCompletion = async (params: {
    messageList: Message[];
    inputAudio?: { data: string; format: string };
  }) => {
    const { data, error } = await supabase.functions.invoke("chat-completion", {
      body: {
        messages: params.messageList.map((m) => ({
          role: m.role,
          content: m.text,
        })),
        scenario,
        inputAudio: params.inputAudio,
      },
    });

    if (error) {
      console.error("Error calling chat-completion", error);
      return null;
    }

    return data;
  };

  useEffect(() => {
    setTimeout(() => {
      confettiRef.current?.start();
    }, 400);
  }, []);

  const handleAssistantData = (
    data: any,
    options?: { replaceUserMessageId?: string },
  ) => {
    if (!data) return;

    setMessages((prev) => {
      let newMessages = [...prev];

      // Replace placeholder if needed
      if (
        options?.replaceUserMessageId &&
        typeof data.userTranscript === "string" &&
        data.userTranscript.trim()
      ) {
        const transcript = data.userTranscript.trim();

        newMessages = newMessages.map((m) =>
          m.id === options.replaceUserMessageId
            ? {
                ...m,
                text: transcript,
              }
            : m,
        );
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: data.text,
        french: data.french,
      };

      return [...newMessages, aiResponse];
    });

    if (data.conversationComplete) {
      setTimeout(() => {
        setConversationComplete(true);
        setTimeout(() => {
          confettiRef.current?.start();
        }, 400);
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1000);
    }
  };

  const handleRecordingToggle = async () => {
    console.log("handleRecordingToggle called, isRecording:", isRecording, "isLoading:", isLoading);
    if (isLoading) return;

    if (!isRecording) {
      console.log("Starting recording...");
      try {
        Speech.stop();

        const perm = await Audio.requestPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Accès au microphone",
            "Vous devez avoir accès au microphone",
          );
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          staysActiveInBackground: true,
        });

        const preset = Audio.RecordingOptionsPresets.HIGH_QUALITY;
        const result = await Audio.Recording.createAsync({
          ...preset,
          ios: {
            ...preset.ios,
            extension: ".wav",
            audioQuality: Audio.IOSAudioQuality.MAX,
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          },
          android: {
            ...preset.android,
            extension: ".wav",
            outputFormat: Audio.AndroidOutputFormat.DEFAULT,
            audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          },
        });

        console.log("createAsync result:", result);
        const { recording } = result;
        console.log("Extracted recording:", recording);
        recordingRef.current = recording;
        console.log("Set recordingRef.current:", recordingRef.current);
        setIsRecording(true);
        console.log("Recording started successfully");
      } catch (error) {
        console.error("Failed to start recording:", error);
        recordingRef.current = null;
        setIsRecording(false);
        Alert.alert("Enregistrement impossible", "Reessayer s'il vous plait");
      }
      return;
    }

    // Stop + Send audio
    console.log("Stopping recording...");

    try {
      console.log("Entered try block");
      const recording = recordingRef.current;
      console.log("Got recording ref:", recording);
      if (!recording) {
        console.log("No recording found, returning");
        setIsRecording(false);
        return;
      }
      setIsRecording(false);

      console.log("About to call stopAndUnloadAsync...");
      try {
        await recording.stopAndUnloadAsync();
        console.log("stopAndUnloadAsync completed");
      } catch (stopError) {
        console.error("Error in stopAndUnloadAsync:", stopError);
        throw stopError;
      }
      const uri = recording.getURI();
      console.log("Got URI:", uri);
      recordingRef.current = null;

      console.log("Recording stopped, URI:", uri);

      if (!uri) {
        setIsLoading(false);
        Alert.alert(
          "Erreur lors de l'enregistrement",
          "Aucun audio n'a été enregistré",
        );
        return;
      }

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("Audio read, length:", base64Audio.length);

      const voiceMessageId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        { id: voiceMessageId, role: "user", text: "Voice message" },
      ]);
      setIsLoading(true);

      console.log("Calling chat completion with audio...");
      const data = await callChatCompletion({
        messageList: messages,
        inputAudio: {
          data: base64Audio,
          format: "wav",
        },
      });
      console.log("Chat completion response:", data);
      handleAssistantData(data, { replaceUserMessageId: voiceMessageId });
      void recordConversationTurn();
    } catch (error) {
      console.error("Failed to start/stop recording:", error);
      setIsLoading(false);
      Alert.alert(
        "Enregistrement impossible",
        "L'envoie de votre message n'a pas fonctionné",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const userText = inputText.trim();
    const newMessage: Message = {
      id: Date().toString(),
      role: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const data = await callChatCompletion({
        messageList: [...messages, newMessage],
      });
      handleAssistantData(data);
      void recordConversationTurn();
    } catch (error) {
      console.error("Message sending error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return;

    if (lastSpokenAssitantMessageId.current === lastMessage.id) return;
    lastSpokenAssitantMessageId.current = lastMessage.id;

    const speechText = lastMessage.text;
    if (!speechText) return;

    const timeoutId = setTimeout(() => {
      handlePlayAudio(speechText);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.light.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top,
              borderBottomColor: Colors.light.icon + "20",
            },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={onExit}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <ThemedText type="defaultSemiBold">{scenario.title}</ThemedText>
            <ThemedText
              style={{ fontSize: 12, color: Colors.subduedTextColor }}
            >
              {scenario.goal}
            </ThemedText>
          </View>
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <TouchableOpacity onPress={() => setIsBlurred(!isBlurred)}>
              <Ionicons
                size={24}
                color={Colors.light.text}
                name={isBlurred ? "eye-off" : "eye"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat area */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContainer}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            let content = msg.text;

            content = msg.text;

            return (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  isUser
                    ? {
                        alignSelf: "flex-end",
                        backgroundColor: Colors.primaryAccentColor,
                      }
                    : {
                        alignSelf: "flex-start",
                        backgroundColor: Colors.light.text + "10",
                      },
                ]}
              >
                <ThemedText
                  style={{
                    color: isUser
                      ? "white"
                      : isBlurred && !isUser
                        ? "transparent"
                        : Colors.light.text,
                    backgroundColor:
                      isBlurred && !isUser
                        ? Colors.light.text + "20"
                        : undefined,
                    borderRadius: 4,
                  }}
                >
                  {content}
                </ThemedText>
                {!isUser && (
                  <TouchableOpacity
                    style={styles.audioButton}
                    onPress={() => handlePlayAudio(msg.text)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="volume-high-outline"
                      size={18}
                      color={Colors.light.text}
                    />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          {isLoading && (
            <View
              style={[
                styles.messageBubble,
                {
                  alignSelf: "flex-start",
                  backgroundColor: Colors.light.text + "10",
                  minWidth: 60,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <ActivityIndicator size="small" color={Colors.light.text} />
            </View>
          )}
        </ScrollView>

        {/* Input Area */}

        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: insets.bottom + 10,
              borderTopColor: Colors.light.icon + "20",
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && { backgroundColor: "#FF4444" },
            ]}
            onPress={handleRecordingToggle}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <View
            style={[
              styles.textInputWrapper,
              { backgroundColor: Colors.light.text + "10" },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: Colors.light.text }]}
              placeholder="Ecris un message..."
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Conversation Complete modal */}

      <Modal
        visible={conversationComplete}
        transparent={true}
        animationType="none"
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.completeModal,
              {
                backgroundColor: "#fff",
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.completeIconContainer}>
              <Ionicons
                name="trophy"
                size={56}
                color={Colors.primaryAccentColor}
              />
            </View>
            <ThemedText style={styles.completeTitle}>
              Fin de conversation!
            </ThemedText>
            <ThemedText style={styles.completeSubtitle}>
              Bon travail! Vous avez finit la conversation
            </ThemedText>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => {
                setConversationComplete(false);
                onExit();
              }}
            >
              <ThemedText style={styles.completeButtonText}>
                Continuez
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <ConfettiCannon
          ref={confettiRef}
          count={20}
          origin={{ x: -10, y: 10 }}
          autoStart={false}
          fadeOut={true}
          fallSpeed={4000}
          explosionSpeed={350}
          colors={[
            Colors.primaryAccentColor,
            "#ff6b35",
            "#FFD700",
            "#34C759",
            "#FF9F0A",
          ]}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    backgroundColor: "transparent",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerContent: {
    alignItems: "center",
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "column",
  },
  audioButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    padding: 6,
    borderRadius: 20,
    backgroundColor: Colors.light.icon + "20",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryAccentColor,
    justifyContent: "center",
    alignItems: "center",
  },
  textInputWrapper: {
    flex: 1,
    borderRadius: 22,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    fontSize: 16,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: "center",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryAccentColor,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  completeModal: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  completeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.primaryAccentColor}20`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  completeSubtitle: {
    fontSize: 16,
    color: Colors.subduedTextColor,
    textAlign: "center",
    marginBottom: 32,
  },
  completeButton: {
    backgroundColor: Colors.primaryAccentColor,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  completeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
