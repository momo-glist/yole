import { Paywall } from "@/components/subscriptions/Paywall";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/ctx/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ConversationsScreen() {
  const { isPremium } = useAuth();
  console.log(isPremium);
  const [paywallVisible, setPaywallVisible] = useState(false);
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
          {isPremium && (
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
        </ScrollView>
      </View>

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
    fontSize: 20,
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
  phraseZh: {
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
