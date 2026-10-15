import { useNetInfo } from '@react-native-community/netinfo';

/** X.1: false só quando o aparelho sabe que está sem rede (estado desconhecido conta como online). */
export function useOnline(): boolean {
  return useNetInfo().isConnected !== false;
}
