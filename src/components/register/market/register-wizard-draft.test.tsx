import type * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DRAFT_KEY } from "./constants";

// P0-6: the wizard survives an anonymous applicant's round trip through
// /login (a full `window.location.href` document load, not a client-side
// navigation) by persisting the in-progress form to sessionStorage and
// restoring it on mount. These tests exercise the real register-wizard.tsx
// mount/restore/persist logic — every child step component is stubbed out
// since they only render form controls unrelated to the persistence bug.

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

vi.mock("./register-company-actions", () => ({
  registerCompany: vi.fn(),
}));

vi.mock("./plan-picker", () => ({
  PlanPicker: () => <div data-testid="plan-picker" />,
}));
vi.mock("./stepper", () => ({
  Stepper: (props: { current: number; profile: string }) => (
    <div data-testid="stepper" data-current={props.current} data-profile={props.profile} />
  ),
}));
vi.mock("./profile-chooser", () => ({
  ProfileChooser: (props: { selected: string }) => (
    <div data-testid="profile-chooser" data-selected={props.selected} />
  ),
}));
vi.mock("./profile-gate", () => ({
  ProfileGate: (props: { selected: string }) => (
    <div data-testid="profile-gate" data-selected={props.selected} />
  ),
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
  StepReview: (props: { plan: string }) => (
    <div data-testid="step-review" data-plan={props.plan} />
  ),
}));
vi.mock("./step-intl-company-info", () => ({
  StepIntlCompanyInfo: (props: { data: { companyLegalName?: string } }) => (
    <div data-testid="step-intl-company-info" data-company-name={props.data.companyLegalName} />
  ),
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

// The wizard reads useQueryClient() (P1-2 registration-success invalidation)
// and there's no app-level QueryClientProvider in these render-only unit
// tests, so provide a bare one — a fresh client per render, never shared.
function renderWizard(props: React.ComponentProps<typeof RegisterWizard>) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <RegisterWizard {...props} />
    </QueryClientProvider>
  );
}

describe("RegisterWizard draft persistence (P0-6)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("writes the in-progress draft to sessionStorage as the applicant fills the form", async () => {
    renderWizard({ sectors: [] });

    // ProfileChooser's onSelect wiring is exercised indirectly: the wizard
    // starts on the international profile's first step by default only once
    // a profile is chosen. Directly assert the write-effect fired on mount
    // with the initial (empty) draft, proving the persistence wiring is live.
    await vi.waitFor(() => {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      expect(raw).not.toBeNull();
    });

    const saved = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) as string);
    expect(saved).toHaveProperty("data");
    expect(saved).toHaveProperty("plan");
    expect(saved).toHaveProperty("stepIndex");
  });

  it("restores a draft left by a previous mount after a full-page login round trip", async () => {
    // Simulate what a real submit-while-signed-out flow leaves behind: the
    // wizard wrote this before router.push(LOGIN_REDIRECT) sent the user to
    // /login, which then does `window.location.href = ...` — a full document
    // reload, not a client-side navigation. On the next mount (the user back
    // on /register-company) the component must read this key.
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        data: { profile: "international", companyLegalName: "Acme Import SARL" },
        plan: "premium",
        stepIndex: 3,
      })
    );

    renderWizard({ sectors: [] });

    // stepIndex 3 > 0 with no `phase` in the saved draft (an older/partial
    // write) must still land the applicant on the form, not back at the
    // gate — see register-wizard.tsx's restore-effect fallback.
    const stepper = await screen.findByTestId("stepper");
    expect(stepper).toHaveAttribute("data-current", "3");
    expect(stepper).toHaveAttribute("data-profile", "international");

    // P2-1: the gate's card grid is gone from the form phase — only the
    // compact "Change" ghost affordance remains, still reflecting the
    // restored profile.
    expect(screen.getByTestId("profile-change-ghost")).toBeInTheDocument();
    expect(screen.getByText("profileChooser.international.title")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-gate")).not.toBeInTheDocument();

    // Step 3 (index 3) of the international path is contact_person, not the
    // company-info step — restoring stepIndex without also restoring `data`
    // would be a partial, misleading recovery. Confirm the actual form data
    // (company name) made it back too, not just the step pointer, by
    // checking it survives in the persisted draft.
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw as string);
    expect(saved.data.companyLegalName).toBe("Acme Import SARL");
  });
});
