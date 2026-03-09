import type { LocalizedText } from "@/types/locale";

export type ManualItem = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  link: string;
  image?: string;
  published?: boolean;
  updatedAt?: string;
};

export type FaqItem = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  tags: string[];
  image?: string;
  published?: boolean;
  updatedAt?: string;
};

export type SupportContact = {
  id: string;
  label: LocalizedText;
  value: string;
  href: string;
};
