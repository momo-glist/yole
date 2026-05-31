import { COURSE_DATA } from "@/constants/CourseData";
import { Redirect } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const practice = () => {
  const lessonId = useLocalSearchParams();
  const [isStudyingVocabulary, setIsStudyingVocabulary] = useState(true);

  const allLessons = COURSE_DATA.chapters.flatMap((c) =>
    c.review ? [...c.lessons, c.review] : c.lessons,
  );

  const currentLeson = allLessons.find((l) => l.id === lessonId);

  const question = currentLesson ? currentLesson.questions[0] : null;

  if (question.length === 0) {
    <Redirect href="/lessons" />;
  }

  if (isStudyingVocabulary) {
    return <SafeAreaView style={styles.container}></SafeAreaView>;
  }

  return (
    <View>
      <Text>practice</Text>
    </View>
  );
};

export default practice;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
