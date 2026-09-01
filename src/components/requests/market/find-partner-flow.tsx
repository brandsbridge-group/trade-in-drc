"use client";

import * as React from "react";

import { NeedTiles } from "./need-tiles";
import { RequestForm } from "./request-form";
import { RequestConfirmation } from "./request-confirmation";
import type { BusinessNeed } from "./find-partner-config";

interface SectorOption {
  id: string;
  label: string;
}

/**
 * Client wrapper coordinating the three columns of design 10:
 *   ① need selection  ②  the form  ③  the confirmation receipt.
 * Holds the selected need, submitted flag and the returned Request ID.
 */
export function FindPartnerFlow({ sectors }: { sectors: SectorOption[] }) {
  const [selectedNeed, setSelectedNeed] = React.useState<BusinessNeed | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);

  const handleSelectNeed = (need: BusinessNeed) => {
    setSelectedNeed(need);
    const node = document.getElementById("request-form");
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmitted = (ref: string | null) => {
    setReference(ref);
    setSubmitted(true);
    document
      .getElementById("request-confirmation")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleReset = () => {
    setSubmitted(false);
    setReference(null);
  };

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-10 md:px-6 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)_minmax(0,0.85fr)]">
        <NeedTiles selected={selectedNeed} onSelect={handleSelectNeed} />
        <RequestForm
          sectors={sectors}
          selectedNeed={selectedNeed}
          onSubmitted={handleSubmitted}
        />
        <div id="request-confirmation" className="scroll-mt-24">
          <RequestConfirmation
            submitted={submitted}
            reference={reference}
            onReset={handleReset}
          />
        </div>
      </div>
    </section>
  );
}
