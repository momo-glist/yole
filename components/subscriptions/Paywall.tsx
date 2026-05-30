import { Colors } from "@/constants/theme";
import { useAuth } from "@/ctx/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const paywallDark = "#020806";
const paywallPanel = "rgba(2, 18, 10, 0.72)";
const paywallAccentSoft = "rgba(0, 191, 99, 0.18)";
const paywallAccentBorder = "rgba(0, 191, 99, 0.34)";

interface Features {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  billingCycle: string;
  features: string[];
  recommended?: boolean;
  savings?: string;
}

const features: Features[] = [
  {
    icon: "book-outline",
    title: "Programme Avancé",
    description:
      "Accédez au programme d’apprentissage oral le plus avancé au monde",
  },
  {
    icon: "trending-up-outline",
    title: "Corrigez Vos Erreurs",
    description:
      "Des leçons personnalisées pour corriger vos erreurs fréquentes",
  },
  {
    icon: "bulb-outline",
    title: "Vocabulaire Personnalisé",
    description: "Apprenez du vocabulaire adapté à vos centres d’intérêt",
  },
  {
    icon: "people-outline",
    title: "Jeux de Rôle Réalistes",
    description: "Pratiquez des conversations du quotidien",
  },
  {
    icon: "mic-outline",
    title: "Coach de Prononciation",
    description: "Recevez des retours instantanés sur votre prononciation",
  },
  {
    icon: "analytics-outline",
    title: "Rapports de Progression",
    description: "Suivez votre évolution grâce à des analyses détaillées",
  },
];

const plans: { annual: Plan; monthly: Plan } = {
  annual: {
    id: "premium_annual",
    name: "Premium",
    price: "96000.00",
    period: "an",
    billingCycle: "Facturé annuellement",
    features: ["Essai gratuit de 7 jours", "Annulation à tout moment"],
    recommended: true,
    savings: "Économisez 40%",
  },
  monthly: {
    id: "premium_monthly",
    name: "Premium",
    price: "10000.00",
    period: "mois",
    billingCycle: "Facturé mensuellement",
    features: ["Essai gratuit de 7 jours", "Annulation à tout moment"],
  },
};

export function Paywall({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">(
    "annual",
  );

  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const selectedPlan = plans[billingCycle];

  const { refreshProfile } = useAuth();

  const handleStartingTrial = async () => {
    try {
      setIsStartingTrial(true);

      const { error } = await supabase.functions.invoke("start-trial", {
        body: {
          planId: selectedPlan.id,
        },
      });

      if (error) throw error;

      await refreshProfile();
      onClose();
    } catch (error) {
      console.error("Error starting trial:", error);
      alert(
        "Une erreur est survenue lors du démarrage de l'essai. Veuillez réessayer.",
      );
    } finally {
      setIsStartingTrial(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <LinearGradient
          colors={[Colors.primaryAccentColor, "#007A3F", paywallDark]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.42, 1]}
        />

        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Passé au plan premium</Text>
          <Text style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introSection}>
            <Text style={styles.title}>
              Rejoignez plus de
              <Text style={styles.highlight}> 5 millions</Text>
              {" d'utilisateurs"}
            </Text>
            <Text style={styles.subtitle}>Apprenez avec Yolo!</Text>
          </View>

          {/* Feature Cards */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View style={styles.featureCard} key={index}>
                <View style={styles.featureIcon}>
                  <Ionicons
                    name={feature.icon}
                    size={24}
                    color={Colors.primaryAccentColor}
                  />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>

          {/* billing cycle Toggle */}

          <View style={styles.toggleContainer}>
            <Pressable
              style={[
                styles.toggleButton,
                billingCycle === "annual" && styles.toggleButtonActive,
              ]}
              onPress={() => setBillingCycle("annual")}
            >
              <Text
                style={[
                  styles.toggleText,
                  billingCycle === "annual" && styles.toggleTextActive,
                ]}
              >
                Annuelle
              </Text>
              {billingCycle === "annual" && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{plans.annual.savings}</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.toggleButton,
                billingCycle === "monthly" && styles.toggleButtonActive,
              ]}
              onPress={() => setBillingCycle("monthly")}
            >
              <Text
                style={[
                  styles.toggleText,
                  billingCycle === "monthly" && styles.toggleTextActive,
                ]}
              >
                Mensuelle
              </Text>
            </Pressable>
          </View>

          {/* Plan Cards */}
          <View style={styles.planCard}>
            {selectedPlan.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Plan populaire</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{selectedPlan.name}</Text>
                <Text style={styles.planBilling}>
                  {selectedPlan.billingCycle}
                </Text>
              </View>
              <View style={styles.planPriceContainer}>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>{selectedPlan.price}</Text>
                  <Text style={styles.planCurrency}>CFA</Text>
                </View>
                <Text style={styles.planPeriod}>{selectedPlan.period}</Text>
              </View>
            </View>

            <View style={styles.planFeatures}>
              {selectedPlan.features.map((feature, index) => (
                <View key={index} style={styles.planFeatureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={Colors.primaryAccentColor}
                    style={styles.planFeatureIcon}
                  />
                  <Text style={styles.planFeatureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CTA Button */}
          <Pressable
            style={[styles.ctaButton, isStartingTrial && { opacity: 0.7 }]}
            disabled={isStartingTrial}
            onPress={handleStartingTrial}
          >
            <Ionicons
              name="star"
              size={20}
              style={styles.ctaIcon}
              color="#fff"
            />
            <Text style={styles.ctaText}>
              {isStartingTrial
                ? "Début de l'essai..."
                : "Commencer l'essai gratuit"}
            </Text>
          </Pressable>

          {/* Footer */}
          <Text style={styles.footer}>
            Essayez pendant 7 jours gratuitement, annulez à tout moment
          </Text>

          {/* Rating */}
          <View style={styles.rating}>
            <View style={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <Ionicons key={i} name="star" color="#FFD700" size={18} />
              ))}
            </View>
            <Text style={styles.ratingText}>4.8 / 5 étoiles</Text>
            <Text style={styles.ratingSubtext}>10,000+ avis sur App Store</Text>
          </View>

          {/* Testimonial */}
          <View style={styles.testimonial}>
            <Text style={styles.testimonialText}>
              Yolo est la meilleur application de cours d'anglais que j'ai
              utilisé!
            </Text>
            <Text style={styles.testimonialAuthor}>- Mahamadou Sogodogo</Text>
          </View>

          {/* Legal links */}
          <View style={styles.legalLinks}>
            <Pressable>
              <Text style={styles.legalLink}>Restauré vos achats</Text>
            </Pressable>
            <Text style={styles.legalSeparator}>•</Text>
            <Pressable>
              <Text style={styles.legalLink}>Conditions d'utilisation</Text>
            </Pressable>
            <Text style={styles.legalSeparator}>•</Text>
            <Pressable>
              <Text style={styles.legalLink}>Politique de confidentialité</Text>
            </Pressable>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paywallDark,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  introSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  highlight: {
    color: "#8DFFBE",
  },
  subtitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
    rowGap: 12,
  },
  featureCard: {
    width: (width - 48) / 2,
    minHeight: 150,
    backgroundColor: paywallPanel,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: paywallAccentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: paywallAccentBorder,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 18,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 15,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: paywallPanel,
    borderRadius: 14,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  toggleButton: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 11,
    gap: 4,
  },
  toggleButtonActive: {
    backgroundColor: "#fff",
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  toggleTextActive: {
    color: paywallDark,
  },
  savingsBadge: {
    backgroundColor: "#34C759",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    alignSelf: "center",
    maxWidth: "100%",
  },
  savingsText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: Colors.primaryAccentColor,
  },
  recommendedBadge: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    backgroundColor: Colors.primaryAccentColor,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12,
  },
  planInfo: {
    flex: 1,
    minWidth: 0,
  },
  planName: {
    fontSize: 22,
    fontWeight: "700",
    color: paywallDark,
  },
  planBilling: {
    fontSize: 14,
    color: Colors.subduedTextColor,
    marginTop: 4,
  },
  planPriceContainer: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  planPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-end",
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: paywallDark,
  },
  planCurrency: {
    fontSize: 12,
    fontWeight: "800",
    color: paywallDark,
    marginLeft: 4,
  },
  planPeriod: {
    fontSize: 14,
    color: Colors.subduedTextColor,
  },
  planFeatures: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
    gap: 12,
  },
  planFeatureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    minHeight: 22,
  },
  planFeatureIcon: {
    marginTop: 1,
  },
  planFeatureText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4b5563",
    fontWeight: "500",
    flex: 1,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryAccentColor,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 32,
    marginBottom: 12,
    shadowColor: Colors.primaryAccentColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaIcon: {
    marginRight: 8,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  footer: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  footerNote: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  rating: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  stars: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  ratingSubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  testimonial: {
    backgroundColor: paywallPanel,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  testimonialText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
    fontStyle: "italic",
    marginBottom: 12,
  },
  testimonialAuthor: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  legalLink: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textDecorationLine: "underline",
  },
  legalSeparator: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  bottomSpacing: {
    height: 40,
  },
});
