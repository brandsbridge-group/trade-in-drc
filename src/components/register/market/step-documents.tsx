"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileUp, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_REGISTRATION_DOCUMENT_EXTENSIONS,
  MAX_REGISTRATION_DOCUMENT_BYTES,
  validateRegistrationDocument,
} from "@/lib/storage/registration-documents";
import type { RegisterFormData } from "./types";
import type { DocumentField } from "./upload-documents";
import { SectionHeader, FieldLabel } from "./field-kit";

interface Props {
  data: RegisterFormData;
  update: (patch: Partial<RegisterFormData>) => void;
  errors: Set<keyof RegisterFormData>;
  /** Lifted to RegisterWizard state so the real File survives past this step —
   *  it is uploaded to Supabase Storage after the company row is created
   *  (see upload-documents.ts for why upload can't happen any earlier). */
  onFileSelect: (field: DocumentField, file: File) => void;
}

function Dropzone({
  label,
  required,
  value,
  onFile,
  browse,
  hint,
  invalid,
  invalidTypeMessage,
  tooLargeMessage,
}: {
  label: string;
  required?: boolean;
  value: string;
  onFile: (file: File) => void;
  browse: string;
  hint: string;
  invalid?: boolean;
  invalidTypeMessage: string;
  tooLargeMessage: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);

  const handleFiles = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    const result = validateRegistrationDocument(file);
    if (!result.ok) {
      toast.error(result.reason === "type" ? invalidTypeMessage : tooLargeMessage);
      return;
    }
    onFile(file);
  };

  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex h-16 cursor-pointer items-center justify-center gap-2 rounded-[0.5rem] border border-dashed px-3 text-xs transition-colors duration-150",
          over
            ? "border-market-navy bg-market-navy/5"
            : "border-slate-300 hover:border-market-navy",
          invalid && "border-market-red"
        )}
      >
        {value ? (
          <span className="flex items-center gap-2 font-medium text-market-navy">
            <FileUp className="size-4" aria-hidden />
            {value}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-slate-500">
            <UploadCloud className="size-4" aria-hidden />
            {hint} <span className="font-semibold text-market-navy">{browse}</span>
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_REGISTRATION_DOCUMENT_EXTENSIONS}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            // Allow re-selecting the same file (e.g. after fixing it) — the
            // browser otherwise skips onChange for an identical selection.
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/** Step 4 — Documents Upload. Files are held in wizard state and uploaded to
 *  Storage only after the company row exists (see upload-documents.ts). */
export function StepDocuments({ data, update, errors, onFileSelect }: Props) {
  const t = useTranslations("RegisterCompany");
  const browse = t("documents.browse");
  const hint = t("documents.dragDrop");
  const has = (k: keyof RegisterFormData) => errors.has(k);
  const invalidTypeMessage = t("documents.invalidType");
  const maxMb = MAX_REGISTRATION_DOCUMENT_BYTES / (1024 * 1024);
  const tooLargeMessage = t("documents.tooLarge", { max: maxMb });

  const select = (field: DocumentField, nameField: keyof RegisterFormData) => (file: File) => {
    onFileSelect(field, file);
    update({ [nameField]: file.name } as Partial<RegisterFormData>);
  };

  return (
    <div>
      <SectionHeader icon={UploadCloud} title={t("sections.documents")} />
      <p className="mb-4 text-xs text-slate-500">{t("documents.helper")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Dropzone
          label={t("fields.rccmCertificate")}
          required
          value={data.rccmCertName}
          onFile={select("rccmCertName", "rccmCertName")}
          browse={browse}
          hint={hint}
          invalid={has("rccmCertName")}
          invalidTypeMessage={invalidTypeMessage}
          tooLargeMessage={tooLargeMessage}
        />
        <Dropzone
          label={t("fields.nifDocument")}
          // P2-8: unconditional `required` lied to international applicants
          // — requiredForStep("documents") already exempts nifDocName for
          // them (types.ts), so the red asterisk demanded a Congolese-only
          // document a foreign applicant cannot possess. Drive the asterisk
          // itself from the same rule the validator uses.
          required={data.profile !== "international"}
          value={data.nifDocName}
          onFile={select("nifDocName", "nifDocName")}
          browse={browse}
          hint={hint}
          invalid={has("nifDocName")}
          invalidTypeMessage={invalidTypeMessage}
          tooLargeMessage={tooLargeMessage}
        />
        <Dropzone
          label={t("fields.companyLogo")}
          value={data.logoName}
          onFile={select("logoName", "logoName")}
          browse={browse}
          hint={hint}
          invalidTypeMessage={invalidTypeMessage}
          tooLargeMessage={tooLargeMessage}
        />
        <Dropzone
          label={t("fields.additionalDocs")}
          value={data.additionalName}
          onFile={select("additionalName", "additionalName")}
          browse={browse}
          hint={hint}
          invalidTypeMessage={invalidTypeMessage}
          tooLargeMessage={tooLargeMessage}
        />
      </div>
    </div>
  );
}
