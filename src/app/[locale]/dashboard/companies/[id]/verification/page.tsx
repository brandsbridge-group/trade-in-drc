"use client";

import { useParams } from "next/navigation";
import { VerificationScreen } from "@/components/dashboard/verification/verification-screen";

/** "Get my company verified": documents, then the send-for-review button. */
export default function CompanyVerificationPage() {
  const params = useParams<{ id: string }>();
  return <VerificationScreen companyId={params.id} />;
}
