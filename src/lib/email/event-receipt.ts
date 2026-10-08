import "server-only";
import { siteOrigin } from "@/lib/site-url";
import { renderEmailLayout } from "./layout";
import { sendEmail } from "./send";

export interface EventReceiptDetails {
  eventName: string;
  eventType: string;
  date: string;
  location: string;
  organizer: string;
}

/**
 * "We received your event": sent to the organiser after a submission.
 * Throws when nothing could be sent — the caller reports it honestly.
 */
export async function sendEventReceiptEmail(
  to: string,
  details: EventReceiptDetails,
  locale: "en" | "fr"
): Promise<void> {
  const fr = locale === "fr";
  const content = renderEmailLayout({
    locale,
    origin: siteOrigin(),
    preheader: fr ? "Votre événement est enregistré et en cours d'examen." : "Your event has been recorded and is under review.",
    heading: fr ? "Votre événement a bien été enregistré" : "Your event has been received",
    paragraphs: fr
      ? ["Bonjour,", "Nous avons bien reçu votre proposition d'événement. Elle est enregistrée et notre équipe procède à son examen avant publication. Nous vous recontacterons à l'adresse indiquée si nous avons besoin d'informations complémentaires ou lorsque le traitement aura avancé.", "Merci de contribuer à la visibilité des opportunités professionnelles en République démocratique du Congo."]
      : ["Hello,", "We have received your event submission. It has been recorded and our team is reviewing it before publication. We will contact you at the address provided if additional information is required or when the review progresses.", "Thank you for helping showcase business opportunities in the Democratic Republic of the Congo."],
    details: [
      [fr ? "Événement" : "Event", details.eventName],
      [fr ? "Type" : "Type", details.eventType],
      [fr ? "Date" : "Date", details.date],
      [fr ? "Lieu" : "Location", details.location],
      [fr ? "Organisateur" : "Organizer", details.organizer],
    ],
  });
  const result = await sendEmail({
    to,
    subject: fr ? "TradeInDRC | Confirmation de réception de votre événement" : "TradeInDRC | Event submission received",
    ...content,
  });
  if (!result.sent) throw new Error(`Event receipt e-mail not sent (${result.reason}).`);
}
