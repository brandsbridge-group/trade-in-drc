"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle } from "lucide-react";
import type { LocalizedFaq } from "@/lib/content/pages";

interface FaqClientProps {
  faqs: LocalizedFaq[];
}

export function FaqClient({ faqs }: FaqClientProps) {
  const t = useTranslations("Faq");
  const reduce = useReducedMotion();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filtered = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return faqs;
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(term) ||
        f.answer.toLowerCase().includes(term)
    );
  }, [faqs, searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-9"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      {faqs.length === 0 ? (
        <div className="text-center py-10">
          <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : filtered.length > 0 ? (
        <Accordion type="single" collapsible className="space-y-2">
          {filtered.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.2, delay: reduce ? 0 : index * 0.04 }}
            >
              <AccordionItem
                value={item.id}
                className="border border-slate-200 bg-card px-6 rounded-xl"
              >
                <AccordionTrigger className="text-left font-medium py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 whitespace-pre-line">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-6">
          <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("noResults")}</p>
        </div>
      )}
    </div>
  );
}
