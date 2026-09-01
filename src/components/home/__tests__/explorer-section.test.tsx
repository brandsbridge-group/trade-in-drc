import { describe, it, expect, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (k: string) => k,
}));

vi.mock("@/i18n/routing", () => ({
  Link: (props: React.HTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a {...props} />
  ),
}));

import { render, screen, fireEvent } from "@testing-library/react";
import { ExplorerTabs } from "../explorer-tabs";

const EMPTY_PROPS = {
  locale: "en",
  sectors: [],
  products: [],
  companies: [],
  opportunities: [],
};

describe("ExplorerTabs", () => {
  it("starts on products tab", () => {
    render(<ExplorerTabs {...EMPTY_PROPS} />);
    expect(
      screen.getByRole("button", { name: /tabs\.products/i })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("switches to opportunities on click", () => {
    render(<ExplorerTabs {...EMPTY_PROPS} />);
    fireEvent.click(
      screen.getByRole("button", { name: /tabs\.opportunities/i })
    );
    expect(
      screen.getByRole("button", { name: /tabs\.opportunities/i })
    ).toHaveAttribute("aria-pressed", "true");
  });
});
