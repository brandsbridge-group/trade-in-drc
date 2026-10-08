import type * as React from "react";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import messages from "@/config/messages/en.json";
import { productDraftKey } from "@/lib/dashboard/product-draft";

// The product editor keeps unsaved edits in this browser: what was typed comes
// back after the page is left, reloaded or crashes, and can be discarded.

vi.mock("@/i18n/routing", () => ({
  Link: (props: React.HTMLAttributes<HTMLAnchorElement> & { href: string }) => <a {...props} />,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() } }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        order: () => Promise.resolve({ data: [], error: null }),
      };
      return chain;
    },
  }),
}));

import { ProductForm } from "./product-form";

const KEY = productDraftKey("co1");
const draft = () => JSON.parse(window.localStorage.getItem(KEY) ?? "null");

beforeAll(() => {
  (globalThis as unknown as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
});

function mount() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProductForm companyId="co1" company={{ name: "Acme", status: "verified" }} />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

const input = (container: HTMLElement, id: string) => container.querySelector<HTMLInputElement>(`#${id}`)!;

describe("ProductForm draft", () => {
  it("stores what is typed and restores it on the next visit", async () => {
    const first = mount();
    fireEvent.change(input(first.container, "product-name"), { target: { value: "Arabica coffee" } });
    fireEvent.change(input(first.container, "product-price"), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: messages.Dashboard.productForm.specs.addRow }));
    fireEvent.change(screen.getByLabelText(messages.Dashboard.productForm.specs.nameLabel), { target: { value: "Origin" } });

    await waitFor(() => expect(draft()?.fields).toEqual({ name_en: "Arabica coffee", price: "150" }));
    expect(draft().specs.custom).toMatchObject([{ label: "Origin", value: "" }]);
    expect(screen.queryByText(messages.Dashboard.productForm.draft.restored)).toBeNull();

    // The page is left (or crashes) and opened again.
    first.unmount();
    const second = mount();
    expect(input(second.container, "product-name").value).toBe("Arabica coffee");
    expect(input(second.container, "product-price").value).toBe("150");
    expect(screen.getByText(messages.Dashboard.productForm.draft.restored)).toBeInTheDocument();
    await waitFor(() =>
      expect((screen.getByLabelText(messages.Dashboard.productForm.specs.nameLabel) as HTMLInputElement).value).toBe("Origin")
    );
  });

  it("discarding empties the form and removes the draft", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ fields: { name_en: "Arabica coffee", unit: "bag" } }));
    const { container } = mount();
    expect(input(container, "product-name").value).toBe("Arabica coffee");

    fireEvent.click(screen.getByRole("button", { name: messages.Dashboard.productForm.draft.discard }));

    expect(input(container, "product-name").value).toBe("");
    expect(screen.queryByText(messages.Dashboard.productForm.draft.restored)).toBeNull();
    await waitFor(() => expect(window.localStorage.getItem(KEY)).toBeNull());
  });

  it("an untouched form writes no draft", async () => {
    mount();
    await waitFor(() => expect(screen.getAllByRole("combobox").length).toBe(3));
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });
});
