import { Paywall } from "@/components/subscriptions/Paywall";
import { ThemedText } from "@/components/ThemedText";
import { conversationScenario, COURSE_DATA } from "@/constants/CourseData";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/ctx/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  createCustomScenarioId,
  listCustomScenarios,
  saveCustomScenario,
} from "@/utils/customScenario";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ConversationsScreen() {
  const { isPremium } = useAuth();
  const router = useRouter();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [isPhrasebookOpen, setIsPhrasebookOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] =
    useState<conversationScenario | null>(null);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [customMyRole, setCustomMyRole] = useState("");
  const [customIaRole, setCustomIaRole] = useState("");
  const [customScene, setCustomScene] = useState("");
  const [customScenarios, setCustomScearios] = useState<conversationScenario[]>(
    [],
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        try {
          const saved = await listCustomScenarios();
          if (isActive) setCustomScearios(saved);
        } catch (err) {
          console.error("Failes to load custom scenarios:", err);
        }
      };

      void load();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleScenarioPress = (scenario: conversationScenario) => {
    if (scenario.isFree || isPremium) {
      setSelectedScenario(scenario);
    } else {
      setPaywallVisible(true);
    }
  };

  const handleStartConversation = () => {
    if (selectedScenario) {
      const id = selectedScenario.id;
      setSelectedScenario(null);
      setIsPhrasebookOpen(false);

      if (id.startsWith("custom_")) {
        router.push({
          pathname: "/conversation",
          params: { customScenarioId: id },
        });
        return;
      }

      router.push({
        pathname: "/conversation",
        params: { scenarioId: id },
      });
    }
  };

  const handleCreateCustom = () => {
    if (isPremium) {
      setIsCreatingCustom(true);
      return;
    }

    setPaywallVisible(true);
  };

  const handleStartCustomConversation = async () => {
    if (!customScene.trim() || isGeneratingScenario) return;

    setIsGeneratingScenario(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "scenario-generate",
        {
          body: {
            myRole: customMyRole,
            airole: customIaRole,
            sceneDescription: customScene,
          },
        },
      );

      if (error) {
        console.error("Error calling scenario-generate", error);
        Alert.alert(
          "Génération impossible du scenario",
          "Reesayer s'il vous plait",
        );
        return;
      }

      const id = createCustomScenarioId();
      const scenario: conversationScenario = {
        id,
        title: data?.title,
        icon: "color-wand",
        isFree: false,
        description: data?.description,
        goal: data?.goal,
        tasks: data?.tasks,
        difficulty: data?.difficulty,
        phrasebook: data?.phrasebook,
      };

      await saveCustomScenario(scenario);
      setCustomScearios((prev) => [scenario, ...prev]);

      setIsCreatingCustom(false);
      setIsPhrasebookOpen(false);
      setCustomIaRole("");
      setCustomMyRole("");
      setCustomScene("");
      setSelectedScenario(scenario);
    } catch (error) {
      console.error("Couldn't generate scenarion", error);
      Alert.alert(
        "Impossible de commancer la conversation",
        "Reessayer s'il vous plait",
      );
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        <View
          style={[styles.header, { borderBottomColor: Colors.borderColor }]}
        >
          <ThemedText style={styles.headerTitle}>Astuces</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {!isPremium && (
            <TouchableOpacity
              style={[
                styles.premiumBanner,
                { backgroundColor: Colors.primaryAccentColor },
              ]}
              onPress={() => setPaywallVisible(true)}
            >
              <View style={styles.premiumContent}>
                <Ionicons
                  name="chatbox"
                  size={24}
                  color="#fff"
                  style={{ marginBottom: 8 }}
                />
                <ThemedText style={styles.premiumTitle}>
                  Obtenez l'accès complet à Yollo
                </ThemedText>
                <ThemedText style={styles.premiumSubtitle}>
                  Débloquez toutes les fonctionnalités et scenarios personalisés
                </ThemedText>
                <View style={styles.premiumButton}>
                  <ThemedText
                    style={[
                      styles.premiumButtonText,
                      { color: Colors.primaryAccentColor },
                    ]}
                  >
                    Passez au pack premium
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.freeTalkCard, { borderColor: Colors.borderColor }]}
            onPress={handleCreateCustom}
          >
            <View style={styles.freeTalkContent}>
              <ThemedText style={{ fontSize: 18 }} type="defaultSemiBold">
                Discussion gratuite
              </ThemedText>
              <ThemedText
                style={{ color: Colors.subduedTextColor, marginTop: 4 }}
              >
                Décrivez un scénario et laissez Yollo vous aider à pratiquer
                votre conversation.
              </ThemedText>
            </View>
            <View style={styles.crystalBallContainer}>
              <Ionicons name="color-wand" size={32} color="#A855F7" />
            </View>
          </TouchableOpacity>

          {/* Scenarios grid */}
          <View style={styles.gridContainer}>
            {[...customScenarios, ...COURSE_DATA.scenarios].map((scenario) => (
              <TouchableOpacity
                key={scenario.id}
                style={[
                  styles.scenarioCard,
                  { borderColor: Colors.borderColor },
                ]}
                onPress={() => {
                  handleScenarioPress(scenario);
                }}
              >
                {scenario.id.startsWith("custom_") && (
                  <View
                    style={[
                      styles.freeBadge,
                      { backgroundColor: Colors.light.text + "22" },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.freeBadge,
                        { color: Colors.subduedTextColor },
                      ]}
                    >
                      CUSTOM
                    </ThemedText>
                  </View>
                )}
                {scenario.isFree && (
                  <View
                    style={[
                      styles.freeBadge,
                      { backgroundColor: Colors.primaryAccentColor },
                    ]}
                  >
                    <ThemedText style={[styles.freeBadgeText]}>
                      GRATUIT
                    </ThemedText>
                  </View>
                )}
                {!scenario.isFree && !isPremium && (
                  <View style={[styles.lockBadge]}>
                    <Ionicons
                      name="lock-closed"
                      size={24}
                      color={Colors.subduedTextColor}
                    />
                  </View>
                )}
                <ThemedText type="defaultSemiBold" style={styles.scenarioTitle}>
                  {scenario.title}
                </ThemedText>
                <View style={styles.scenarioIconContainer}>
                  <Ionicons
                    name={scenario.icon}
                    size={35}
                    color={
                      scenario.isFree || isPremium
                        ? Colors.primaryAccentColor
                        : Colors.subduedTextColor
                    }
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Sceanrio Detail Modal */}

      <Modal
        visible={!!selectedScenario}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSelectedScenario(null);
          setIsPhrasebookOpen(false);
        }}
      >
        <View style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (isPhrasebookOpen) {
                    setIsPhrasebookOpen(false);
                    return;
                  }
                  setSelectedScenario(null);
                  setIsPhrasebookOpen(false);
                }}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={Colors.light.text}
                />
              </TouchableOpacity>
              <ThemedText type="defaultSemiBold">
                {isPhrasebookOpen ? "Manuel" : ""}
              </ThemedText>
              <View style={{ width: 40 }}></View>
            </View>
            <ScrollView
              key={isPhrasebookOpen ? "Manuel" : "Scenario"}
              contentContainerStyle={styles.modalContent}
            >
              {isPhrasebookOpen ? (
                (selectedScenario?.phrasebook ?? []).map((p, idx) => (
                  <View
                    key={`${p.characters} - ${idx}`}
                    style={[
                      styles.phraseRow,
                      { borderColor: Colors.borderColor },
                    ]}
                  >
                    <ThemedText style={styles.phraseEn}>
                      {p.characters}
                    </ThemedText>
                    <ThemedText style={{ color: Colors.subduedTextColor }}>
                      {p.french}
                    </ThemedText>
                  </View>
                ))
              ) : (
                <>
                  <View style={styles.modalIconContainer}>
                    <Ionicons
                      name={selectedScenario?.icon}
                      size={64}
                      color={Colors.primaryAccentColor}
                    />
                  </View>
                  <ThemedText type={"title"} style={styles.modalTitle}>
                    {selectedScenario?.title}
                  </ThemedText>

                  <View style={styles.section}>
                    <ThemedText
                      type="defaultSemiBold"
                      style={styles.sectionHeader}
                    >
                      Scenario
                    </ThemedText>
                    <ThemedText style={{ color: Colors.subduedTextColor }}>
                      {selectedScenario?.description}
                    </ThemedText>
                  </View>

                  <View style={styles.guidelinesCard}>
                    <ThemedText
                      type="defaultSemiBold"
                      style={{ marginBottom: 8 }}
                    >
                      Directives de la duscussion gratuite
                    </ThemedText>
                    <View style={styles.guidelineItem}>
                      <Ionicons
                        name="warning-outline"
                        size={16}
                        color="#F59E0B"
                      />
                      <ThemedText style={styles.guidelineText}>
                        Pas de conversations inappropriées
                      </ThemedText>
                    </View>
                    <View style={styles.guidelineItem}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={16}
                        color="#F59E0B"
                      />
                      <ThemedText style={styles.guidelineText}>
                        Non destiné aux conseils
                      </ThemedText>
                    </View>
                    <View style={styles.guidelineItem}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={16}
                        color="#F59E0B"
                      />
                      <ThemedText style={styles.guidelineText}>
                        Ne partagéz pas d'informations personnelles
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <ThemedText
                      type="defaultSemiBold"
                      style={styles.sectionHeader}
                    >
                      Objectif
                    </ThemedText>
                    <View
                      style={[
                        styles.goalCard,
                        { borderColor: Colors.borderColor },
                      ]}
                    >
                      <ThemedText type="defaultSemiBold">
                        {selectedScenario?.goal}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <ThemedText
                      type="defaultSemiBold"
                      style={styles.sectionHeader}
                    >
                      Taches
                    </ThemedText>
                    {selectedScenario?.tasks.map((task, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.taskCard,
                          { borderColor: Colors.borderColor },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={20}
                          color={Colors.subduedTextColor}
                        />
                        <ThemedText>{task}</ThemedText>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.phrasebookButton,
                      { backgroundColor: Colors.light.text + "10" },
                    ]}
                    onPress={() => {
                      const entries = selectedScenario?.phrasebook ?? [];
                      if (entries.length > 0) {
                        Alert.alert(
                          "Pas de Manuel",
                          "Ce scenario n'a pas de manuel disponible.",
                        );
                        return;
                      }
                      setIsPhrasebookOpen(true);
                    }}
                  >
                    <Ionicons
                      name="book-outline"
                      size={20}
                      color={Colors.primaryAccentColor}
                    />
                    <ThemedText
                      style={{
                        color: Colors.primaryAccentColor,
                        fontWeight: "600",
                      }}
                    >
                      Voir le Manuel
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
            {!isPhrasebookOpen && (
              <View
                style={[styles.footer, { borderTopColor: Colors.borderColor }]}
              >
                <TouchableOpacity
                  style={[
                    styles.startButton,
                    { backgroundColor: Colors.primaryAccentColor },
                  ]}
                  onPress={handleStartConversation}
                >
                  <ThemedText style={styles.startButtonText}>Start</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Custom Conversation Modal */}

      <Modal
        visible={isCreatingCustom}
        animationType="slide"
        presentationStyle={isGeneratingScenario ? "fullScreen" : "pageSheet"}
        onRequestClose={() => {
          if (isGeneratingScenario) {
            setIsGeneratingScenario(false);
          }
        }}
      >
        <View style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
              behavior="padding"
              style={{ flex: 1 }}
              keyboardVerticalOffset={0}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    if (isGeneratingScenario) return;
                    setIsCreatingCustom(false);
                  }}
                  disabled={isGeneratingScenario}
                  style={[
                    styles.backButton,
                    isGeneratingScenario && { opacity: 0.4 },
                  ]}
                >
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    color={Colors.light.text}
                  />
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold">Créer</ThemedText>
                <View style={{ width: 40 }}></View>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
                <ThemedText
                  style={{ color: Colors.subduedTextColor, marginBottom: 20 }}
                >
                  Remplissez les champs de role et decrivez en detail la scène
                  et la conversation que vous souhaitez avoir.
                </ThemedText>

                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.inputContainer,
                      { borderColor: Colors.borderColor },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={Colors.subduedTextColor}
                    />
                    <TextInput
                      placeholder="Mon role"
                      style={[styles.input, { color: Colors.light.text }]}
                      placeholderTextColor={Colors.subduedTextColor}
                      value={customMyRole}
                      onChangeText={setCustomMyRole}
                    />
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { borderColor: Colors.borderColor },
                    ]}
                  >
                    <Ionicons
                      name="happy-outline"
                      size={20}
                      color={Colors.subduedTextColor}
                    />
                    <TextInput
                      placeholder="le role de l'ia"
                      style={[styles.input, { color: Colors.light.text }]}
                      placeholderTextColor={Colors.subduedTextColor}
                      value={customIaRole}
                      onChangeText={setCustomIaRole}
                    />
                  </View>

                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor: Colors.borderColor,
                        height: 120,
                        alignItems: "flex-start",
                        paddingTop: 16,
                      },
                    ]}
                  >
                    <Ionicons
                      name="image-outline"
                      size={20}
                      color={Colors.subduedTextColor}
                      style={{ marginTop: 5 }}
                    />
                    <TextInput
                      placeholder="Décrivez la scène"
                      style={[
                        styles.input,
                        {
                          color: Colors.light.text,
                          height: "100%",
                          textAlignVertical: "top",
                        },
                      ]}
                      placeholderTextColor={Colors.subduedTextColor}
                      value={customScene}
                      multiline
                      onChangeText={setCustomScene}
                    />
                  </View>
                </View>
              </ScrollView>

              <View
                style={[styles.footer, { borderTopColor: Colors.borderColor }]}
              >
                <TouchableOpacity
                  style={[
                    styles.startButton,
                    {
                      backgroundColor: Colors.primaryAccentColor,
                      opacity: customScene && !isGeneratingScenario ? 1 : 0.5,
                    },
                  ]}
                  disabled={!customScene && isGeneratingScenario}
                  onPress={handleStartCustomConversation}
                >
                  <ThemedText style={styles.startButtonText}>
                    {isGeneratingScenario
                      ? "Génération en cours..."
                      : "Générer le scénario"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>

      <Paywall
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 115,
    paddingTop: 20,
  },
  premiumBanner: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumContent: {
    alignItems: "center",
  },
  premiumTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  premiumSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  premiumButton: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  premiumButtonText: {
    color: "#2563EB",
    fontWeight: "bold",
  },
  freeTalkCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  freeTalkContent: {
    flex: 1,
    paddingRight: 16,
  },
  crystalBallContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  scenarioCard: {
    width: "47%",
    maxWidth: 200,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  freeBadge: {
    backgroundColor: "#2563EB",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  freeBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  lockBadge: {
    alignSelf: "flex-start",
    padding: 4,
  },
  scenarioTitle: {
    fontSize: 15,
  },
  scenarioIconContainer: {
    alignSelf: "flex-end",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  modalContent: {
    padding: 24,
  },
  modalIconContainer: {
    alignSelf: "center",
    marginBottom: 24,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 8,
    fontSize: 18,
  },
  guidelinesCard: {
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  guidelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  guidelineText: {
    fontSize: 13,
    color: "#92400E",
    flex: 1,
  },
  goalCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  phrasebookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  phraseRow: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  phraseEn: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  startButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  inputGroup: {
    gap: 12,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
});
