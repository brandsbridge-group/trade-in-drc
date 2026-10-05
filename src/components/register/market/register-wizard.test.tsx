import type * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SIGNUP_REDIRECT } from "./constants";
import type { RegisterFormData } from "./types";

// Short, signed-in-only company form (brief v2): profile gate → company →
// contact (→ optional DRC interests for international companies) → submit.

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const pushMock = vi.fn();
vi.mock("@/i18n/routing", () => ({
  Link: (props: React.HTMLAttributes<HTMLAnchorElement> & { href: string }) => <a {...props} />,
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

const registerCompanyMock = vi.fn();
vi.mock("./register-company-actions", () => ({
  registerCompany: (...args: unknown[]) => registerCompanyMock(...args),
}));

vi.mock("./stepper", () => ({ Stepper: () => <div data-testid="stepper" /> }));

type StepProps = { update: (patch: Partial<RegisterFormData>) => void; data: RegisterFormData };

// The chooser exposes both profiles as plain buttons.
vi.mock("./profile-chooser", () => ({
  ProfileChooser: ({ onSelect }: { onSelect: (p: string) => void }) => (
    <div>
      <button onClick={() => onSelect("international")}>pick-international</button>
    </div>
  ),
}));

// Step stubs fill their own required fields on click.
vi.mock("./step-company", () => ({
  StepCompany: ({ update, data }: StepProps) => (
    <div data-testid="step-company">
      <button
        onClick={() =>
          update(
            data.profile === "international"
              ? { companyLegalName: "Anka Ltd", country: "Turkey", sectorId: "s1", city: "Istanbul" }
              : { companyLegalName: "Acme SARL", sectorId: "s1", province: "Kinshasa", city: "Kinshasa" }
          )
        }
      >
        fill-company
      </button>
    </div>
  ),
}));
vi.mock("./step-contact", () => ({
  StepContact: () => <div data-testid="step-contact" />,
}));
vi.mock("./step-market-interest-optional", () => ({
  StepMarketInterestOptional: ({ update }: StepProps) => (
    <div data-testid="step-market-interest">
      <button onClick={() => update({ drcInterests: ["investment"], entryTimeline: "immediately" })}>
        fill-interests
      </button>
    </div>
  ),
}));

import { RegisterWizard, readDraft, toSubmitData, type RegisterAccount } from "./register-wizard";
import { EMPTY_FORM } from "./types";

const ACCOUNT: RegisterAccount = {
  id: "u1",
  email: "jean@acme.cd",
  fullName: "Jean Mukendi",
  phone: "+243812345678",
};

function renderWizard(account: RegisterAccount | null, queryClient = new QueryClient()) {
  render(
    <QueryClientProvider client={queryClient}>
      <RegisterWizard sectors={[]} account={account} />
    </QueryClientProvider>
  );
  return queryClient;
}

/** Gate → company step filled → contact step. The form mounts only once the
 *  gate has exited (AnimatePresence mode="wait"), hence the findBy. */
async function walkToContact() {
  fireEvent.click(screen.getByText("continue"));
  fireEvent.click(await screen.findByText("fill-company"));
  fireEvent.click(screen.getByText("nav.next"));
}

describe("RegisterWizard — signed out", () => {
  beforeEach(() => {
    pushMock.mockReset();
    registerCompanyMock.mockReset();
    window.localStorage.clear();
  });

  it("sends the visitor to account creation instead of showing the form", () => {
    renderWizard(null);
    fireEvent.click(screen.getByText("createAccountToContinue"));
    expect(pushMock).toHaveBeenCalledWith(SIGNUP_REDIRECT);
    expect(screen.queryByTestId("step-company")).toBeNull();
  });
});

describe("RegisterWizard — signed in", () => {
  beforeEach(() => {
    pushMock.mockReset();
    registerCompanyMock.mockReset();
    window.localStorage.clear();
  });

  it("creates a Congolese company in two steps, as free, with the account's contact details", async () => {
    registerCompanyMock.mockResolvedValue({ ok: true, companyId: "c1" });
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    renderWizard(ACCOUNT, queryClient);

    await walkToContact();
    expect(screen.getByTestId("step-contact")).toBeTruthy();
    fireEvent.click(screen.getByText("nav.submit"));

    await waitFor(() => expect(registerCompanyMock).toHaveBeenCalledTimes(1));
    const { plan, data } = registerCompanyMock.mock.calls[0][0];
    expect(plan).toBe("free");
    expect(data).toMatchObject({
      companyLegalName: "Acme SARL",
      officialEmail: "jean@acme.cd",
      contactPerson: "Jean Mukendi",
      dialCode: "+243",
      phone: "812345678",
    });
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["companies", "u1"] })
    );
    expect(await screen.findByText("success.title")).toBeTruthy();
  });

  it("lets an international company skip the optional step, dropping its answers", async () => {
    registerCompanyMock.mockResolvedValue({ ok: true });
    renderWizard(ACCOUNT);

    fireEvent.click(screen.getByText("pick-international"));
    await walkToContact();
    fireEvent.click(screen.getByText("nav.next"));
    fireEvent.click(screen.getByText("fill-interests"));
    fireEvent.click(screen.getByTestId("skip-optional"));

    await waitFor(() => expect(registerCompanyMock).toHaveBeenCalledTimes(1));
    const { data } = registerCompanyMock.mock.calls[0][0];
    expect(data.drcInterests).toEqual([]);
    expect(data.entryTimeline).toBe("");
    expect(data.headOffice).toBe("Istanbul, Turkey");
  });

  it("keeps the optional answers when the international company submits them", async () => {
    registerCompanyMock.mockResolvedValue({ ok: true });
    renderWizard(ACCOUNT);

    fireEvent.click(screen.getByText("pick-international"));
    await walkToContact();
    fireEvent.click(screen.getByText("nav.next"));
    fireEvent.click(screen.getByText("fill-interests"));
    fireEvent.click(screen.getByText("nav.submit"));

    await waitFor(() => expect(registerCompanyMock).toHaveBeenCalledTimes(1));
    expect(registerCompanyMock.mock.calls[0][0].data.drcInterests).toEqual(["investment"]);
  });

  it("blocks Next while the company step is incomplete", async () => {
    renderWizard(ACCOUNT);
    fireEvent.click(screen.getByText("continue"));
    await screen.findByTestId("step-company");
    fireEvent.click(screen.getByText("nav.next"));
    expect(screen.getByTestId("step-company")).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("jumps back to the step holding a field the server rejected", async () => {
    registerCompanyMock.mockResolvedValue({ ok: false, error: "invalid", fields: ["city"] });
    renderWizard(ACCOUNT);

    await walkToContact();
    fireEvent.click(screen.getByText("nav.submit"));

    await waitFor(() => expect(screen.getByTestId("step-company")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toContain("fields.city");
  });
});

describe("RegisterWizard — draft", () => {
  beforeEach(() => {
    registerCompanyMock.mockReset();
    window.localStorage.clear();
  });

  it("keeps what was typed across a reload, and drops it once the company exists", async () => {
    registerCompanyMock.mockResolvedValue({ ok: true, companyId: "c1" });
    const first = render(
      <QueryClientProvider client={new QueryClient()}>
        <RegisterWizard sectors={[]} account={ACCOUNT} />
      </QueryClientProvider>
    );
    await walkToContact();
    await screen.findByTestId("step-contact");
    await waitFor(() => expect(readDraft(ACCOUNT.id)?.data.companyLegalName).toBe("Acme SARL"));
    first.unmount();

    // "Reload": a fresh mount resumes on the contact step, past the gate.
    renderWizard(ACCOUNT);
    expect(await screen.findByTestId("step-contact")).toBeTruthy();
    expect(screen.getByText("draft.restored")).toBeTruthy();

    fireEvent.click(screen.getByText("nav.submit"));
    expect(await screen.findByText("success.title")).toBeTruthy();
    expect(readDraft(ACCOUNT.id)).toBeNull();
  });
});

describe("toSubmitData", () => {
  it("splits the E.164 phone into dial code and national number", () => {
    const out = toSubmitData({ ...EMPTY_FORM, phone: "+243812345678" }, false);
    expect(out.dialCode).toBe("+243");
    expect(out.phone).toBe("812345678");
  });

  it("composes the international head office as 'City, Country'", () => {
    const out = toSubmitData(
      { ...EMPTY_FORM, profile: "international", city: "Lyon", country: "France" },
      false
    );
    expect(out.headOffice).toBe("Lyon, France");
  });
});
