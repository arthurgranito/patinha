import { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/theme';

// F01-1: três telas curtas antes dos botões de login. Sem promessa de resultado (ADR-07).
export const SLIDES = [
  {
    emoji: '⏱️',
    title: '10 minutinhos por dia',
    body: 'Treinos curtos e guiados, com vídeo, passos e clicker. Só reforço positivo.',
  },
  {
    emoji: '🏅',
    title: 'Níveis e conquistas',
    body: 'Cada truque tem níveis. Cada pequeno avanço do seu cão vira conquista.',
  },
  {
    emoji: '📸',
    title: 'Um card para postar',
    body: 'Compartilhe no story o que vocês aprenderam juntos.',
  },
] as const;

export function Boasvindas() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const pageWidth = width - theme.spacing.lg * 2;
  const [page, setPage] = useState(0);

  return (
    <View style={{ gap: theme.spacing.md }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth))}
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.title}
            style={[styles.slide, { width: pageWidth, gap: theme.spacing.sm }]}
          >
            <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
              {slide.emoji}
            </Text>
            <Text variant="title" style={styles.center}>
              {slide.title}
            </Text>
            <Text muted style={styles.center}>
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View
        style={[styles.dots, { gap: theme.spacing.xs }]}
        accessibilityLabel={`Tela ${page + 1} de ${SLIDES.length}`}
      >
        {SLIDES.map((slide, i) => (
          <View
            key={slide.title}
            style={[
              styles.dot,
              { backgroundColor: i === page ? theme.colors.primary : theme.colors.border },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  emoji: { fontSize: 56, lineHeight: 68 },
  center: { textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
