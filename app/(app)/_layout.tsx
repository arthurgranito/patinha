import { Stack } from 'expo-router';

// TODO(fase 1): redirecionar para (auth) quando não houver sessão.
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
