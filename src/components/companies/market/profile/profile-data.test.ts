import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

import { toProfileFacts } from "./profile-data";

describe("toProfileFacts", () => {
  it("reads the four public registration facts", () => {
    expect(toProfileFacts({ trading_name: " Kivu Saveurs ", year_established: "2014", legal_form: "sa", employees: "1-10" })).toEqual({
      tradingName: "Kivu Saveurs",
      yearEstablished: "2014",
      legalForm: "sa",
      employees: "1-10",
    });
  });

  it("treats a missing answer, an empty string or an unexpected shape as not provided", () => {
    const empty = { tradingName: null, yearEstablished: null, legalForm: null, employees: null };
    expect(toProfileFacts(null)).toEqual(empty);
    expect(toProfileFacts("oops")).toEqual(empty);
    expect(toProfileFacts({ trading_name: "  ", year_established: 2014 })).toEqual(empty);
  });
});
