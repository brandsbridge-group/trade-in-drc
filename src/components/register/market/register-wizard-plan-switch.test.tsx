import type * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DRAFT_KEY } from "./constants";

// P1-5 regression: the client's own complaint was "when I push to choose 'I
// am international company' the plan disappears" (P1-4). The related bug
// this file guards against is subtler — a Congolese-only "verified" pick
// silently SURVIVING the switch to the international profile, where that
// tier is never actually offered (INTL_REGISTER_PLANS has only free/premium)
// yet the review screen and the server payload would still carry it.
//
// These tests exercise the real register-wizard.tsx selectProfile() wiring
// via the sessionStorage draft round trip (same mechanism
// register-wizard-draft.test.tsx already exercises for P0-6), which lets the
// wizard start already mid-form without needing every stubbed step to fill
// in its own required fields just to walk goNext's client-side validation.

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

vi.mock("./stepper", () => ({
  Stepper: () => <div data-testid="stepper" />,
}));

// Real onSelect wiring, minimal markup — this is the whole point of the test.
vi.mock("./profile-chooser", () => ({
  ProfileChooser: (props: {
    selected: string;
    onSelect: (profile: string) => void;
  }) => (
    <div data-testid="profile-chooser" data-selected={props.selected}>
      <button type="button" onClick={() => props.onSelect("congolese")}>
        congolese
      </button>
      <button type="button" onClick={() => props.onSelect("international")}>
        international
      </button>
    </div>
  ),
}));

vi.mock("./plan-picker", () => ({
  PlanPicker: (props: { selected: string; namespace: string }) => (
    <div
      data-testid="plan-picker"
      data-selected={props.selected}
      data-namespace={props.namespace}
    />
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

describe("RegisterWizard plan/profile interaction (P1-4, P1-5, P2-2)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("P2-2: the plan step is reachable on the Congolese path via a restored draft, reading the tiers namespace", async () => {
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        data: { profile: "congolese", companyLegalName: "Acme SARL" },
        plan: "verified",
        stepIndex: 4, // "plan" — second-to-last of CONGOLESE_STEPS
      })
    );

    renderWizard({ sectors: [] });

    const picker = await screen.findByTestId("plan-picker");
    expect(picker).toHaveAttribute("data-namespace", "tiers");
    expect(picker).toHaveAttribute("data-selected", "verified");
  });

  it("P1-5: a Congolese 'verified' pick does not survive switching to the international profile", async () => {
    // Start already on the Congolese plan step with "verified" chosen —
    // exactly the state the client's bug report describes reaching before
    // clicking "I am an international company".
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        data: { profile: "congolese", companyLegalName: "Acme SARL" },
        plan: "verified",
        stepIndex: 4,
      })
    );

    renderWizard({ sectors: [] });
    expect(await screen.findByTestId("plan-picker")).toHaveAttribute(
      "data-selected",
      "verified"
    );

    // P2-1: the account-type cards no longer sit next to the wizard — the
    // applicant has to go back to the gate via the "Change" ghost button
    // before "international" is clickable again.
    fireEvent.click(screen.getByTestId("profile-change-ghost"));
    fireEvent.click(await screen.findByText("international"));

    // selectProfile() restarts the wizard at step 0 (company_info for the
    // international path), so the plan step itself isn't on screen right
    // after the click — but the persisted draft is the ground truth for
    // wizard state, same mechanism the P0-6 draft-persistence tests assert
    // against, and it updates synchronously with the state change.
    await vi.waitFor(() => {
      const saved = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) as string);
      expect(saved.data.profile).toBe("international");
      // The bug this guards against: this used to still read "verified" — a
      // tier the international ladder (INTL_REGISTER_PLANS) never offers.
      expect(saved.plan).toBe("free");
    });
  });
});
