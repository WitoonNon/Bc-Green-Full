import type { LocalizedText } from "@/types/locale";

export type PromotionItem = {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  content?: LocalizedText;
  badge?: LocalizedText;
  image: string;
  startAt?: string;
  endAt?: string;
  published?: boolean;
  source?: string;
  seed?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
