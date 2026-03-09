"use client";

import Link from "next/link";
import { ArrowRightIcon, ChatIcon, LineIcon, MailIcon, PhoneIcon, QuestionIcon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import { supportContacts } from "@/data/support";

export default function SupportCards() {
  const { t, pick } = useI18n();
  const faqHint = t("support.faq");
  const chatHint = t("support.subtitle");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-1">
        <Link href="/help/faq">
          <Card className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <QuestionIcon />
              </span>
              <div>
                <div className="text-sm font-semibold">{t("support.faq")}</div>
                <div className="text-xs text-[--text-soft]">{faqHint}</div>
              </div>
            </div>
            <ArrowRightIcon className="text-emerald-600" />
          </Card>
        </Link>
      </div>
      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <ChatIcon />
          </span>
          <div>
            <div className="text-sm font-semibold">{t("support.chat")}</div>
            <div className="text-xs text-[--text-soft]">{chatHint}</div>
          </div>
        </div>
        <div className="grid gap-2 text-sm text-[--text-mid] md:grid-cols-2">
          {supportContacts.map((contact) => {
            let Icon = PhoneIcon;
            if (contact.id === "line") Icon = LineIcon;
            if (contact.id === "email") Icon = MailIcon;

            return (
              <a
                key={contact.id}
                href={contact.href}
                className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white/70 px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} className="text-emerald-600" />
                  {pick(contact.label)}
                </span>
                <span className="font-semibold">{contact.value}</span>
              </a>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
