import { Check, Minus } from "lucide-react";
import type { Translator } from "./types";

/**
 * Plan availability matrix (design 12). Row labels come from i18n
 * (`Premium.compare.rows`); the ✓ / — structure is a fixed named constant here
 * because it is layout, not copy. Order MUST match the i18n `rows` array.
 */
const PLAN_MATRIX: ReadonlyArray<{
  free: boolean;
  verified: boolean;
  premium: boolean;
}> = [
  { free: true, verified: true, premium: true }, // Directory Listing
  { free: false, verified: true, premium: true }, // Basic Company Information
  { free: false, verified: true, premium: true }, // Contact Details
  { free: false, verified: true, premium: true }, // Verified Badge
  { free: false, verified: true, premium: true }, // Priority in Search Results
  { free: false, verified: true, premium: true }, // Bilingual Profile
  { free: false, verified: true, premium: true }, // Product / Service Showcase
  { free: false, verified: true, premium: true }, // Partnership Requests
  { free: false, verified: true, premium: true }, // B2B Meeting Invitations
  { free: false, verified: true, premium: true }, // Visibility Reports
  { free: false, verified: false, premium: true }, // Sponsored Placement
  { free: false, verified: false, premium: true }, // BrandsBridge Introduction
];

function Cell({ on }: { on: boolean }) {
  return (
    <td className="px-2 py-2.5 text-center align-middle">
      {on ? (
        <Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={2.5} />
      ) : (
        <Minus className="mx-auto h-4 w-4 text-slate-300" strokeWidth={2.5} />
      )}
    </td>
  );
}

export function CompareTable({ t }: { t: Translator }) {
  const rows = t.raw("compare.rows") as string[];

  return (
    <div className="w-full rounded-[0.75rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-black/20 sm:p-6">
      <h2 className="text-center font-display text-lg font-bold tracking-tight text-market-navy">
        {t("compare.title")}
      </h2>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="w-2/5 px-2 pb-2.5 text-xs font-bold text-market-navy">
                {t("compare.featuresLabel")}
              </th>
              <th className="px-2 pb-2.5 text-center align-bottom text-[11px] font-bold leading-tight text-slate-700">
                {t("compare.cols.free")}
              </th>
              <th className="px-2 pb-2.5 text-center align-bottom text-[11px] font-bold leading-tight text-slate-700">
                {t("compare.cols.verified")}
                <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                  {t("compare.cols.verifiedNote")}
                </span>
              </th>
              <th className="px-2 pb-2.5 text-center align-bottom text-[11px] font-bold leading-tight text-market-navy">
                {t("compare.cols.premium")}
                <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                  {t("compare.cols.premiumNote")}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((label, i) => {
              const cells = PLAN_MATRIX[i];
              return (
                <tr
                  key={label}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-2 py-2.5 text-xs text-slate-700">{label}</td>
                  <Cell on={cells.free} />
                  <Cell on={cells.verified} />
                  <Cell on={cells.premium} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
