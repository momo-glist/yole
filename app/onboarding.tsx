import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/ctx/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Onboarding() {
  const color = Colors["light"];
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<string | null>(null);
  const [motivation, setMotivation] = useState<string[]>([]);
  const [selectInterests, setSelectInterests] = useState<string[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);

  const { refreshProfile } = useAuth();

  const LEVELS = [
    {
      id: "debutant",
      title: "Débutant",
      description: "Je connais quelque mots mais pas beaucoup",
    },
    {
      id: "intermediaire",
      title: "Intermediaire",
      description:
        "J'arrive à faire quelques conversations simples mais j'ai du mal à comprendre les natifs",
    },
    {
      id: "avance",
      title: "Avancé",
      description:
        "J'arrive à m'exprimer assez facilement et à comprendre les natifs",
    },
  ];

  const MOTIVATIONS = [
    {
      id: "voyages",
      title: "Voyages",
      icon: "airplane-outline",
    },
    {
      id: "travail",
      title: "Travail",
      icon: "briefcase-outline",
    },
    {
      id: "famille",
      title: "Famille",
      icon: "people-outline",
    },
    {
      id: "culture",
      title: "Culture",
      icon: "book-outline",
    },
    {
      id: "fun",
      title: "Fun",
      icon: "game-controller-outline",
    },
  ];

  const INTERESTS = [
    "La nourriture",
    "Le businesse",
    "Le quotidien",
    "Les technologies",
    "L'art",
    "La musique",
    "La politique",
    "Le sport",
  ];

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const isNextEnable = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return !!level;
    if (step === 2) return motivation.length > 0;
    if (step === 3) return selectInterests.length > 0;
    return false;
  };

  const saveProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Cet utilisateur est introuvable");

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: name,
        language_level: level,
        motivations: motivation,
        interests: selectInterests,
        onboarding_completed: true,
        updated_at: new Date().toString(),
      });

      if (error) throw error;

      await refreshProfile();

      setShowPaywall(true);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert(
        "Une erreur est survenue lors de la sauvegarde du profil. Veuillez réessayer.",
      );
    }
  };

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      saveProfile();
    }
  };

  const toggleMotivation = (id: string) => {
    if (motivation.includes(id)) {
      setMotivation(motivation.filter((m) => m !== id));
    } else {
      setMotivation([...motivation, id]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectInterests.includes(interest)) {
      setSelectInterests(selectInterests.filter((i) => i !== interest));
    } else {
      setSelectInterests([...selectInterests, interest]);
    }
  };

  const renderStep0Name = () => (
    <View style={styles.stepContainer}>
      <ThemedText type="title" style={styles.title}>
        {"Comment devons nous t'appéler ?"}
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Votre nom sera utilisé pour personaliser votre expérience.
      </ThemedText>

      <TextInput
        style={[styles.input, { color: color.text, borderColor: color.icon }]}
        placeholder="Entré votre nom"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={setName}
        autoFocus
      />
    </View>
  );

  const renderStep1Level = () => (
    <View style={styles.stepContainer}>
      <ThemedText type="title" style={styles.title}>
        {"Quel est ton niveau d'anglais?"}
      </ThemedText>

      <ScrollView
        contentContainerStyle={{ rowGap: 16 }}
        style={{ marginTop: 20 }}
      >
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={l.id}
            style={[
              styles.optionCard,
              level === l.id && {
                borderColor: Colors.primaryAccentColor,
                backgroundColor: "#E8FFF3",
              },
            ]}
            onPress={() => setLevel(l.id)}
          >
            <ThemedText
              style={[
                styles.optionTitle,
                level === l.id && { color: Colors.primaryAccentColor },
              ]}
            >
              {l.title}
            </ThemedText>
            <ThemedText style={[styles.optionDescription]}>
              {l.description}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep2Motivation = () => (
    <View style={styles.stepContainer}>
      <ThemedText type="title" style={styles.title}>
        {"Pourquoi voulez vous apprendre l'anglais?"}
      </ThemedText>
      <ThemedText style={styles.subtitle}>Cochez les cases.</ThemedText>

      <ScrollView
        contentContainerStyle={{ rowGap: 16 }}
        style={{ marginTop: 10 }}
      >
        {MOTIVATIONS.map((m) => {
          const isSelected = motivation.includes(m.id);

          return (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.optionCard,
                styles.motivationCard,
                isSelected && {
                  borderColor: Colors.primaryAccentColor,
                  backgroundColor: "#E8FFF3",
                },
              ]}
              onPress={() => toggleMotivation(m.id)}
            >
              <Ionicons
                name={m.icon as any}
                size={24}
                color={isSelected ? Colors.primaryAccentColor : color.icon}
              />
              <ThemedText
                style={[
                  styles.optionTitle,
                  isSelected && { color: Colors.primaryAccentColor },
                ]}
              >
                {m.title}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderStep3Interets = () => (
    <View style={styles.stepContainer}>
      <ThemedText type="title" style={styles.title}>
        {"Qu'est ce qui vous intéresse?"}
      </ThemedText>
      <ThemedText style={styles.subtitle}>Cochez les cases.</ThemedText>

      <View style={{ ...styles.tagsContainer }}>
        {INTERESTS.map((i) => {
          const isSelected = selectInterests.includes(i);

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.tag,
                isSelected && {
                  backgroundColor: Colors.primaryAccentColor,
                  borderColor: Colors.primaryAccentColor,
                },
              ]}
              onPress={() => toggleInterest(i)}
            >
              <ThemedText
                style={[styles.tagText, isSelected && { color: "#FFF" }]}
              >
                {i}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: color.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            {step > -1 && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons
                  name="arrow-back-outline"
                  size={24}
                  color={color.text}
                />
              </TouchableOpacity>
            )}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${((step + 1) / 4) * 100}%`,
                    backgroundColor: Colors.primaryAccentColor,
                  },
                ]}
              />
            </View>
          </View>
          <View style={styles.mainContent}>
            <Animated.View
              key={step}
              entering={FadeIn}
              exiting={FadeOut}
              style={{ flex: 1 }}
            >
              {step === 0 && renderStep0Name()}
              {step === 1 && renderStep1Level()}
              {step === 2 && renderStep2Motivation()}
              {step === 3 && renderStep3Interets()}
            </Animated.View>
          </View>
        </View>
        <View style={[styles.footer, { zIndex: 10 }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: isNextEnable()
                  ? Colors.primaryAccentColor
                  : "#E5E7EB",
              },
            ]}
            onPress={handleContinue}
            disabled={!isNextEnable()}
          >
            <ThemedText style={styles.continueButtonText}>
              {step === 3 ? "Commencer" : "Suivant"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 60,
  },
  backButton: {
    marginRight: 16,
    paddingVertical: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.subduedTextColor,
    marginBottom: 32,
  },
  input: {
    fontSize: 20,
    borderBottomWidth: 2,
    paddingVertical: 12,
    marginTop: 20,
  },
  optionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  motivationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.subduedTextColor,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
  },
  tag: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tagText: {
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    width: "100%",
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
