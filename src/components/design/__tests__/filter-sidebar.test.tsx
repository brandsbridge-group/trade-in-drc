import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FilterSidebar, FilterGroup, FilterItem } from "../filter-sidebar";

describe("FilterSidebar", () => {
  it("renders label and items", () => {
    render(
      <FilterSidebar>
        <FilterGroup label="Sectors">
          <FilterItem label="Mining" count={12} />
        </FilterGroup>
      </FilterSidebar>
    );
    expect(screen.getByText("Sectors")).toBeInTheDocument();
    expect(screen.getByText("Mining")).toBeInTheDocument();
  });

  it("toggles aria-expanded on header click", () => {
    render(
      <FilterSidebar>
        <FilterGroup label="Sectors">
          <FilterItem label="Mining" />
        </FilterGroup>
      </FilterSidebar>
    );
    const header = screen.getByRole("button", { name: /sectors/i });
    expect(header).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("removes content from the DOM after the exit transition", async () => {
    render(
      <FilterSidebar>
        <FilterGroup label="Sectors">
          <FilterItem label="Mining" />
        </FilterGroup>
      </FilterSidebar>
    );
    fireEvent.click(screen.getByRole("button", { name: /sectors/i }));
    await waitFor(
      () => expect(screen.queryByText("Mining")).not.toBeInTheDocument(),
      { timeout: 500 }
    );
  });
});
