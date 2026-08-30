import * as SecureStore from 'expo-secure-store';

const GROQ_KEY = 'fitia_groq_key';
const MISTRAL_KEY = 'fitia_mistral_key';

export type ApiProvider = 'groq' | 'mistral';

export interface ApiKeys {
  groq: string | null;
  mistral: string | null;
}

const STORE_KEY: Record<ApiProvider, string> = {
  groq: GROQ_KEY,
  mistral: MISTRAL_KEY,
};

export async function getApiKeys(): Promise<ApiKeys> {
  const [groq, mistral] = await Promise.all([
    SecureStore.getItemAsync(GROQ_KEY),
    SecureStore.getItemAsync(MISTRAL_KEY),
  ]);
  return { groq, mistral };
}

export async function saveApiKey(provider: ApiProvider, value: string): Promise<void> {
  await SecureStore.setItemAsync(STORE_KEY[provider], value.trim());
}

export async function deleteApiKey(provider: ApiProvider): Promise<void> {
  await SecureStore.deleteItemAsync(STORE_KEY[provider]);
}
