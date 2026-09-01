import type * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DRAFT_KEY } from "./constants";

// P1-2 regression: use-companies.ts used to force a refetch on EVERY mount
// (`refetchOnMount: "always"`) just so a freshly registered company would
// appear on the dashboard without waiting out the 60s staleTime — but that
// re-issued the full companies query on every navigation between any of the
// ~10 dashboard surfaces that mount useCompanies(), not just the one right
// after registration. The real fix moved to a targeted
// queryClient.invalidateQueries({ queryKey: ["companies", userId] }) fired
// from the wizard's own submit() on a successful registration. This test
// exercises that call directly, proving the client-reported bug ("my new
// company doesn't show up") stays fixed under the narrower invalidation.

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/routing", () => ({
  Link: (props: React.HTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a {...props} />
  ),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: { id: "u1" }, loading: false }),
}));

const registerCompanyMock = vi.fn();
vi.mock("./register-company-actions", () => ({
  registerCompany: (...args: unknown[]) => registerCompanyMock(...args),
}));

vi.mock("./stepper", () => ({
  Stepper: () => <div data-testid="stepper" />,
}));
vi.mock("./profile-chooser", () => ({
  ProfileChooser: () => <div data-testid="profile-chooser" />,
}));
vi.mock("./plan-picker", () => ({
  PlanPicker: () => <div data-testid="plan-picker" />,
}));
vi.mock("./step-legal", () => ({ StepLegal: () => <div data-testid="step-legal" /> }));
vi.mock("./step-professional", () => ({
  StepProfessional: () => <div data-testid="step-professional" />,
}));
vi.mock("./step-positioning", () => ({
  StepPositioning: () => <div data-testid="step-positioning" />,
}));
vi.mock("./step-documents", () => ({
  StepDocuments: () => <div data-testid="step-documents" />,
}));
vi.mock("./step-review", () => ({
  StepReview: () => <div data-testid="step-review" />,
}));
vi.mock("./step-intl-company-info", () => ({
  StepIntlCompanyInfo: () => <div data-testid="step-intl-company-info" />,
}));
vi.mock("./step-intl-business-profile", () => ({
  StepIntlBusinessProfile: () => <div data-testid="step-intl-business-profile" />,
}));
vi.mock("./step-intl-market-interest", () => ({
  StepIntlMarketInterest: () => <div data-testid="step-intl-market-interest" />,
}));
vi.mock("./step-intl-contact-person", () => ({
  StepIntlContactPerson: () => <div data-testid="step-intl-contact-person" />,
}));
vi.mock("./intl-sidebar", () => ({ IntlSidebar: () => <div data-testid="intl-sidebar" /> }));
vi.mock("./intl-strips", () => ({ IntlStrips: () => <div data-testid="intl-strips" /> }));

import { RegisterWizard } from "./register-wizard";

function renderWizard(
  props: React.ComponentProps<typeof RegisterWizard>,
  queryClient: QueryClient
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <RegisterWizard {...props} />
    </QueryClientProvider>
  );
}

// A fully-filled Congolese draft: submit() re-validates every step via
// missingFields before calling registerCompany, so every field
// requiredForStep (types.ts) lists for "legal"/"professional"/"positioning"/
// "documents" must be present, or the wizard silently redirects to the
// first incomplete step instead of ever reaching the server action.
const VALID_CONGOLESE_DATA = {
  profile: "congolese" as const,
  country: "Democratic Republic of the Congo",
  companyLegalName: "Acme SARL",
  tradingName: "",
  rccmNumber: "CD/KIN/RCCM/23-A-1234",
  nationalId: "01-1234-N12345Q",
  nif: "A1234567L",
  yearEstablished: "2010",
  legalForm: "sarl",
  employees: "1_10",
  sectorId: "agriculture",
  productsServices: "Coffee export",
  province: "Kinshasa",
  city: "Kinshasa",
  website: "",
  officialEmail: "owner@acme.cd",
  dialCode: "+243",
  phone: "812345678",
  altPhone: "",
  contactPerson: "Jean Mukendi",
  jobTitle: "CEO",
  languages: ["fr"],
  interests: ["export"],
  rccmCertName: "rccm.pdf",
  nifDocName: "nif.pdf",
  logoName: "",
  headOffice: "",
  annualTurnover: "",
  currentMarkets: "",
  certifications: "",
  drcInterests: [],
  targetProvinces: [],
  entryTimeline: "",
  marketInterestNotes: "",
};

describe("RegisterWizard registration-success cache invalidation (P1-2)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    registerCompanyMock.mockReset();
  });

  it("invalidates the exact [\"companies\", userId] query on a successful submit", async () => {
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        data: VALID_CONGOLESE_DATA,
        plan: "free",
        stepIndex: 5, // "review" — last of CONGOLESE_STEPS
        phase: "form",
      })
    );
    registerCompanyMock.mockResolvedValue({ ok: true });

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderWizard({ sectors: [] }, queryClient);

    fireEvent.click(await screen.findByText("nav.submit"));

    await waitFor(() => {
      expect(registerCompanyMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["companies", "u1"] });
    });
  });

  it("does not invalidate any query when the server rejects the submission", async () => {
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        data: VALID_CONGOLESE_DATA,
        plan: "free",
        stepIndex: 5,
        phase: "form",
      })
    );
    registerCompanyMock.mockResolvedValue({ ok: false, error: "server" });

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderWizard({ sectors: [] }, queryClient);

    fireEvent.click(await screen.findByText("nav.submit"));

    await waitFor(() => {
      expect(registerCompanyMock).toHaveBeenCalledTimes(1);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
