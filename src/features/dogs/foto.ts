import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export const FOTO_LADO_MAX = 1080;

export type PickResult = { uri: string } | { canceled: true } | { denied: true };

/** F08-2: reduz o lado maior para 1080 px e salva em JPEG. */
export async function compressPhoto(asset: {
  uri: string;
  width: number;
  height: number;
}): Promise<string> {
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > FOTO_LADO_MAX) {
    ctx.resize(asset.width >= asset.height ? { width: FOTO_LADO_MAX } : { height: FOTO_LADO_MAX });
  }
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return saved.uri;
}

/** Câmera ou galeria, com recorte quadrado; devolve o JPEG já comprimido. */
export async function pickDogPhoto(source: 'camera' | 'galeria'): Promise<PickResult> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };
  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { denied: true };
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }
  if (result.canceled || !result.assets?.[0]) return { canceled: true };
  return { uri: await compressPhoto(result.assets[0]) };
}
