import * as SecureStore from 'expo-secure-store';

const GROQ_KEY = 'fitia_groq_key';
const MISTRAL_KEY = 'fitia_mistral_key';

export interface ApiKeys {
  groq: string | null;
  mistral: string | null;
}

export async function getApiKeys(): Promise<ApiKeys> {
  const [groq, mistral] = await Promise.all([
    SecureStore.getItemAsync(GROQ_KEY),
    SecureStore.getItemAsync(MISTRAL_KEY),
  ]);
  return { groq, mistral };
}

export async function saveApiKeys(keys: ApiKeys): Promise<void> {
  await Promise.all([
    keys.groq
      ? SecureStore.setItemAsync(GROQ_KEY, keys.groq.trim())
      : SecureStore.deleteItemAsync(GROQ_KEY),
    keys.mistral
      ? SecureStore.setItemAsync(MISTRAL_KEY, keys.mistral.trim())
      : SecureStore.deleteItemAsync(MISTRAL_KEY),
  ]);
}
