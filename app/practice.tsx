import LessonContent from "@/components/lesson/LessonContent";
import VocabularyIntroScreen from "@/components/lesson/VocabularyIntroScreen";
import { COURSE_DATA } from "@/constants/CourseData";
import { Redirect, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Practice = () => {
  const { lessonId } = useLocalSearchParams<{ lessonId?: string | string[] }>();
  const normalizedLessonId = Array.isArray(lessonId) ? lessonId[0] : lessonId;
  const [isStudyingVocabulary, setIsStudyingVocabulary] = useState(true);

  const allLessons = COURSE_DATA.chapters.flatMap((c) =>
    c.review ? [...c.lessons, c.review] : c.lessons,
  );

  const currentLesson = allLessons.find((l) => l.id === normalizedLessonId);

  const questions = currentLesson?.questions ?? [];

  if (questions.length === 0) {
    return <Redirect href="/lessons" />;
  }

  if (isStudyingVocabulary) {
    return (
      <SafeAreaView style={styles.container}>
        <VocabularyIntroScreen
          key={normalizedLessonId}
          questions={questions}
          onStartLesson={() => setIsStudyingVocabulary(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LessonContent questions={questions} lessonId={normalizedLessonId} />
    </SafeAreaView>
  );
};

export default Practice;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
