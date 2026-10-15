# Motor de cards em React Native — contrato, utilitários e armadilhas

Use este arquivo como base quando o motor ainda não existir em `src/features/cards/`, ou como checklist quando ele já existir. O código é TypeScript para Expo e usa `react-native-view-shot`, `expo-sharing` e `expo-media-library` (instale sempre com `npx expo install`).

## Sumário
1. Como o motor funciona
2. Estrutura de pastas
3. Constantes, unidade e área segura
4. Texto em pt-BR
5. CardFrame (moldura comum)
6. Capturar, compartilhar e salvar
7. Exemplo de template (truque dominado)
8. Tela de pré-visualização
9. Armadilhas

---

## 1. Como o motor funciona

- **O que a pessoa vê é o que é capturado.** O card aparece na pré-visualização com a largura da tela (por exemplo, 300 px lógicos), na proporção 9:16.
- **Medidas proporcionais:** todos os tamanhos são multiplicados por uma **unidade `u` = largura ÷ 360**. Assim, o mesmo template fica idêntico em qualquer tamanho.
- **Captura:** `captureRef` exporta a View em **1080×1920** (as opções `width` e `height` reescalam a imagem final).
- **Por que não renderizar fora da tela:** no Android, Views posicionadas fora da janela podem sair em branco na captura. Capturar a própria pré-visualização evita esse problema.

## 2. Estrutura de pastas

```
src/features/cards/
├── motor/
│   ├── constantes.ts     # proporção, SAFE em unidades, cores das paletas
│   ├── texto.ts          # plural, numero, frases prontas
│   ├── CardFrame.tsx     # moldura: fundo, área segura, marca
│   └── exportar.ts       # capturarCard, compartilharCard, salvarCard
├── templates/
│   ├── index.ts
│   ├── TruqueDominado.tsx
│   ├── Sequencia.tsx
│   ├── Conquista.tsx
│   ├── Carteirinha.tsx
│   └── DesafioConcluido.tsx
├── fixtures/             # dados de borda (assets/fixtures-borda.json da skill)
└── PreviewCard.tsx       # pré-visualização + paletas + botões
```

## 3. Constantes, unidade e área segura

```tsx
// motor/constantes.ts
export const BASE_W = 360;            // largura lógica de referência
export const BASE_H = 640;            // 9:16
export const EXPORT_W = 1080;
export const EXPORT_H = 1920;
/** Área segura do story, em unidades da base 360×640 (= 250 px em 1920 e 72 px em 1080). */
export const SAFE = { top: 84, bottom: 84, side: 24 } as const;

export type Paleta = { bg: string; fg: string; muted: string; accent: string; surface: string; premium?: boolean };

export const PALETAS: Record<string, Paleta> = {
  caramelo: { bg: '#FFF4E6', fg: '#2B1D0E', muted: '#7A6650', accent: '#E07A1F', surface: '#F6E3CC' },
  noite: { bg: '#15120F', fg: '#FFF4E6', muted: '#B8A68F', accent: '#FFA53D', surface: '#2A231C' },
};

/** Unidade proporcional: tudo no template é escrito em "pontos de 360" e multiplicado por u. */
export const unidade = (larguraNaTela: number) => larguraNaTela / BASE_W;
```

## 4. Texto em pt-BR

```tsx
// motor/texto.ts
const nf = new Intl.NumberFormat('pt-BR');
export const numero = (n: number) => nf.format(n);
export const plural = (n: number, um: string, varios: string) => `${numero(n)} ${n === 1 ? um : varios}`;

/** "aprendeu a dar a pata em 3 dias" / "em 1 dia" / "no primeiro dia". */
export function fraseTempo(dias: number): string {
  if (dias <= 1) return 'no primeiro dia';
  return `em ${plural(dias, 'dia', 'dias')}`;
}

/** Nome curto para caber no título; o resto fica no subtítulo. */
export function nomeCurto(nome: string, max = 14): string {
  const n = nome.trim();
  return n.length <= max ? n : `${n.slice(0, max - 1).trimEnd()}…`;
}
```

## 5. CardFrame (moldura comum)

```tsx
// motor/CardFrame.tsx
import { forwardRef, type ComponentRef, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BASE_H, BASE_W, SAFE, type Paleta } from './constantes';

/** Tipo da ref de uma View (nas versões novas do RN, View é componente de função: use ComponentRef). */
export type ViewRef = ComponentRef<typeof View>;

type Props = { largura: number; paleta: Paleta; children: ReactNode; marca?: boolean };

/** Moldura 9:16 com a área segura aplicada. O ref é o que vai para captureRef. */
export const CardFrame = forwardRef<ViewRef, Props>(function CardFrame({ largura, paleta, children, marca = true }, ref) {
  const u = largura / BASE_W;
  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.base, { width: largura, height: (largura * BASE_H) / BASE_W, backgroundColor: paleta.bg }]}
    >
      <View style={{ flex: 1, paddingTop: SAFE.top * u, paddingBottom: SAFE.bottom * u, paddingHorizontal: SAFE.side * u }}>
        {children}
      </View>
      {marca && (
        <Text
          style={[styles.marca, { bottom: (SAFE.bottom - 22) * u, fontSize: 10 * u, color: paleta.fg }]}
          numberOfLines={1}
        >
          patinha.app · Treine seu cão em 10 min/dia
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  marca: { position: 'absolute', left: 0, right: 0, textAlign: 'center', opacity: 0.65 },
});
```

## 6. Capturar, compartilhar e salvar

```tsx
// motor/exportar.ts
import type { RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { EXPORT_H, EXPORT_W } from './constantes';
import type { ViewRef } from './CardFrame';

/** Captura a View do card em PNG 1080×1920 num arquivo temporário. */
export async function capturarCard(ref: RefObject<ViewRef | null>): Promise<string> {
  if (!ref.current) throw new Error('card-nao-montado');
  return captureRef(ref, { format: 'png', quality: 1, width: EXPORT_W, height: EXPORT_H, result: 'tmpfile' });
}

export type ResultadoCompartilhar = 'compartilhado' | 'indisponivel';

/** Abre a folha de compartilhar do sistema (Instagram Stories, WhatsApp, ...). */
export async function compartilharCard(uri: string): Promise<ResultadoCompartilhar> {
  if (!(await Sharing.isAvailableAsync())) return 'indisponivel';
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Compartilhar card' });
  return 'compartilhado';
}

export type ResultadoSalvar = 'salvo' | 'sem-permissao';

/** Salva na galeria, pedindo permissão só agora (fluxo F28). */
export async function salvarCard(uri: string): Promise<ResultadoSalvar> {
  const perm = await MediaLibrary.requestPermissionsAsync(true); // writeOnly
  if (!perm.granted) return 'sem-permissao';
  await MediaLibrary.saveToLibraryAsync(uri);
  return 'salvo';
}
```

`shareAsync` resolve quando a folha fecha. Ele **não diz** se a pessoa postou ou cancelou, então registre `card_shared` como "abriu a folha", não como "postou".

## 7. Exemplo de template (truque dominado)

```tsx
// templates/TruqueDominado.tsx
import { Image, StyleSheet, Text, View } from 'react-native';
import { CardFrame, type ViewRef } from '../motor/CardFrame';
import { BASE_W, type Paleta } from '../motor/constantes';
import { fraseTempo, nomeCurto } from '../motor/texto';

export type DadosTruque = { nomeCao: string; fotoUri: string | null; truque: string; dias: number };

type Props = { dados: DadosTruque; paleta: Paleta; largura: number; frameRef?: React.Ref<ViewRef> };

export function TruqueDominado({ dados, paleta, largura, frameRef }: Props) {
  const u = largura / BASE_W;
  const foto = 200 * u;
  return (
    <CardFrame ref={frameRef} largura={largura} paleta={paleta}>
      <View style={styles.coluna}>
        <Text style={{ color: paleta.muted, fontSize: 14 * u, fontWeight: '600' }}>TRUQUE DOMINADO 🏆</Text>

        <View style={[styles.fotoMoldura, { width: foto, height: foto, borderRadius: foto / 2, borderWidth: 5 * u, borderColor: paleta.accent, backgroundColor: paleta.surface }]}>
          {dados.fotoUri ? (
            <Image source={{ uri: dados.fotoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 80 * u, color: paleta.accent, fontWeight: '800' }}>
              {(dados.nomeCao.trim()[0] ?? '?').toUpperCase()}
            </Text>
          )}
        </View>

        <Text style={{ color: paleta.fg, fontSize: 30 * u, fontWeight: '800', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {nomeCurto(dados.nomeCao)}
        </Text>
        <Text style={{ color: paleta.fg, fontSize: 20 * u, textAlign: 'center' }} numberOfLines={2}>
          aprendeu a <Text style={{ color: paleta.accent, fontWeight: '800' }}>{dados.truque.toLowerCase()}</Text>
        </Text>
        <Text style={{ color: paleta.muted, fontSize: 16 * u }}>{fraseTempo(dados.dias)} 🐾</Text>
      </View>
    </CardFrame>
  );
}

const styles = StyleSheet.create({
  coluna: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  fotoMoldura: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
```

## 8. Tela de pré-visualização

```tsx
// PreviewCard.tsx (essencial)
import { useRef, useState } from 'react';
import { Alert, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { PALETAS } from './motor/constantes';
import { capturarCard, compartilharCard, salvarCard } from './motor/exportar';
import type { ViewRef } from './motor/CardFrame';
import { TruqueDominado, type DadosTruque } from './templates/TruqueDominado';

export function PreviewTruque({ dados }: { dados: DadosTruque }) {
  const { width } = useWindowDimensions();
  const largura = Math.min(320, width * 0.8);
  const ref = useRef<ViewRef>(null);
  const [paleta, setPaleta] = useState<keyof typeof PALETAS>('caramelo');
  const [ocupado, setOcupado] = useState(false);

  async function acao(tipo: 'compartilhar' | 'salvar') {
    try {
      setOcupado(true);
      const uri = await capturarCard(ref);
      if (tipo === 'compartilhar') {
        if ((await compartilharCard(uri)) === 'indisponivel') Alert.alert('Compartilhar indisponível neste aparelho.');
      } else if ((await salvarCard(uri)) === 'sem-permissao') {
        Alert.alert('Sem permissão não dá para salvar. Você ainda pode compartilhar direto.');
      } else {
        Alert.alert('Card salvo na galeria 📸');
      }
    } catch {
      Alert.alert('Não conseguimos gerar a imagem. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      <TruqueDominado dados={dados} paleta={PALETAS[paleta]} largura={largura} frameRef={ref} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {Object.keys(PALETAS).map((p) => (
          <Pressable key={p} onPress={() => setPaleta(p as keyof typeof PALETAS)} accessibilityLabel={`Paleta ${p}`}>
            <Text>{p}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable disabled={ocupado} onPress={() => acao('compartilhar')} accessibilityRole="button">
        <Text>Compartilhar</Text>
      </Pressable>
      <Pressable disabled={ocupado} onPress={() => acao('salvar')} accessibilityRole="button">
        <Text>Salvar na galeria</Text>
      </Pressable>
    </View>
  );
}
```

## 9. Armadilhas

| Problema | Onde | Sintoma | Como evitar |
|---|---|---|---|
| Card fora da tela sai em branco | Android | PNG vazio | capturar a própria pré-visualização (seção 1) e usar `collapsable={false}` |
| Foto remota não aparece | todos | buraco no lugar da foto | baixar a foto do cão para o cache local (`expo-file-system`) antes e usar o `file://`; esperar o `onLoad` da imagem antes de liberar o botão |
| Fonte personalizada não aplicada | todos | fonte do sistema no PNG | carregar as fontes com `expo-font` no início do app; nunca capturar antes de `fontsLoaded` |
| `adjustsFontSizeToFit` diferente entre plataformas | Android antigo | texto cortado | limitar a `numberOfLines` e testar os nomes longos dos fixtures nos dois sistemas |
| Emoji diferente por aparelho | todos | largura e aparência variam | emoji só decorativo, nunca estrutural |
| Permissão da galeria | iOS/Android | erro ao salvar | pedir só ao salvar (`writeOnly`) e explicar antes |
| Instagram Stories direto | iOS/Android | não abre o editor do Stories | a folha do sistema já oferece o Stories; o compartilhamento direto exige App ID da Meta (deixe para depois) |
| Compressão do Instagram | story | faixas, linhas finas somem | contraste forte e linhas ≥ 1 u (≈ 3 px na exportação) |
