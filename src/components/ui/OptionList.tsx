import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import { Text } from './Text';

export type Option<T extends string | number> = {
  value: T;
  label: string;
  hint?: string;
  icon?: string;
  /** Tamanho do ícone (o porte do cão usa para a "ilustração"). */
  iconSize?: number;
};

type Props<T extends string | number> = {
  options: Option<T>[];
  selected: T[];
  multiple?: boolean;
  onToggle: (value: T) => void;
};

/** Lista de escolhas grandes e acessíveis (radio ou checkbox). */
export function OptionList<T extends string | number>({
  options,
  selected,
  multiple = false,
  onToggle,
}: Props<T>) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {options.map((o) => {
        const checked = selected.includes(o.value);
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityLabel={o.hint ? `${o.label}, ${o.hint}` : o.label}
            accessibilityState={{ checked }}
            onPress={() => onToggle(o.value)}
            style={[
              styles.option,
              {
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                borderColor: checked ? theme.colors.primary : theme.colors.border,
                borderWidth: checked ? 2 : 1,
              },
            ]}
          >
            {o.icon ? (
              <View style={styles.icon}>
                <Text style={{ fontSize: o.iconSize ?? 24, lineHeight: (o.iconSize ?? 24) * 1.2 }}>
                  {o.icon}
                </Text>
              </View>
            ) : null}
            <View style={styles.texts}>
              <Text style={{ fontWeight: checked ? '700' : '400' }}>{o.label}</Text>
              {o.hint ? (
                <Text variant="caption" muted>
                  {o.hint}
                </Text>
              ) : null}
            </View>
            {checked ? (
              <Text style={{ color: theme.colors.link, fontWeight: '700' }}>✓</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  icon: { width: 56, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
});
