/**
 * "Can this client be booked into this product yet?"
 *
 * Four checks, in the order the booking form shows them — Wealth, Acknowledge,
 * KYC, Risk Profile. They come from two places and the form does not
 * distinguish:
 *
 * - **Derived** — `kyc` from the client's own KYC record, `risk-profile` from
 *   their risk rating against the product's. Neither is a form anyone fills in
 *   here, so neither can be stale relative to the KYC countdown on the client's
 *   own profile.
 * - **Stored** — `wealth` and `acknowledge`, per client, in
 *   `data/order-requirements.json`.
 *
 * Each row carries the link that fixes it ("Open Wealth Declare", "Risk
 * Consent"). That link is the whole of the escape hatch: a client who is
 * missing something cannot be booked from this app, and the only forward move
 * is sending them into the system that owns the record.
 */

import { kycExpiry } from "../client/[id]/client-detail-data";
import { mockClientRequirements } from "@/lib/order-mock-data";
import type { BookableProduct } from "./bookable-products";
import type {
  Client,
  ClientReadiness,
  RequirementItem,
  RequirementKey,
  RequirementRequest,
  RequirementStatus,
} from "@/types/domain";

/**
 * What each requirement is called and where it is fixed.
 *
 * `system` is what makes a request mean something: it has to say which system
 * the client is being sent to, or it is a to-do with no address.
 * `selfService` is whether sending them there accomplishes anything.
 */
export const REQUIREMENT_CATALOG: Record<
  RequirementKey,
  { label: string; system: string; selfService: boolean }
> = {
  wealth: {
    label: "Wealth Status",
    system: "Wealth Declare",
    selfService: true,
  },
  acknowledge: {
    label: "Acknowledge Status",
    // The same form as the row above — one declaration produces both answers,
    // so both send the client to the same place.
    system: "Wealth Declare",
    selfService: true,
  },
  kyc: {
    label: "KYC Status",
    system: "Yuanta e-KYC",
    // A KYC review is started by the branch against the client in person, not
    // from an order screen — including it in a request would be asking for
    // something the client cannot go and do.
    selfService: false,
  },
  "risk-profile": {
    label: "Risk Profile Status",
    system: "Risk Consent",
    selfService: true,
  },
};

/** Risk ratings in order, so two of them can be compared rather than matched. */
const RISK_ORDER = ["Conservative", "Moderate", "Aggressive"] as const;

function riskRank(profile: string): number {
  const i = RISK_ORDER.indexOf(profile as (typeof RISK_ORDER)[number]);
  // An unrecognised rating ranks lowest rather than passing by default — a
  // booking gate that fails open is not a gate.
  return i === -1 ? 0 : i;
}

/**
 * The risk rating this product asks of a client.
 *
 * Read off the product's own tags rather than stored as a field: a note that
 * guarantees the principal is a different proposition from one that doesn't,
 * and "รับประกันเงินต้น" is already how the catalogue says which is which.
 * Everything else in this category is a yield-enhancement note whose downside
 * is the underlying, which is an aggressive product by any reading.
 */
export function requiredRiskProfile(product: BookableProduct): string {
  return product.tags.includes("รับประกันเงินต้น") ? "Moderate" : "Aggressive";
}

/**
 * Which requirements this product gates on, in display order.
 *
 * The same four for both structured desks today. It takes the product anyway,
 * because the next desk to be added is the one that will need a different list
 * — and a function that already takes the product is a change in one body
 * rather than a change at every call site.
 */
export function productRequirementKeys(_product: BookableProduct): RequirementKey[] {
  return ["wealth", "acknowledge", "kyc", "risk-profile"];
}

/** A stored Yes/No row — `wealth` and `acknowledge`. */
function storedItem(key: "wealth" | "acknowledge", status: RequirementStatus): RequirementItem {
  return {
    key,
    ...REQUIREMENT_CATALOG[key],
    // Never a value. Every answer this row can give is a yes or a no, and the
    // icon gives it — in a colour and a shape, from the far side of the card.
    // "No" printed next to a red cross is the same answer twice.
    value: null,
    status,
    // What the icon cannot say: a cross means "not on file", a warning means
    // "was on file", and only the second one needs a sentence.
    detail: status === "expired" ? "แบบแจ้งหมดอายุ ต้องยื่นใหม่" : null,
  };
}

/** The KYC row — derived from the client's own KYC record. */
function kycItem(clientId: string): RequirementItem {
  const base = { key: "kyc" as const, ...REQUIREMENT_CATALOG.kyc };
  const expiry = kycExpiry(clientId);

  // Same rule as the stored rows: the icon answers, the sentence explains.
  if (!expiry) {
    return {
      ...base,
      value: null,
      status: "missing",
      detail: "ยังไม่มีข้อมูล KYC ในระบบ",
    };
  }
  // An unparseable review date is not a pass and not a lapse — it is a record
  // nobody can read, and the IC needs to be told that rather than shown a
  // countdown derived from it.
  if (expiry.daysLeft === null) {
    return {
      ...base,
      value: null,
      status: "pending",
      detail: `รอตรวจสอบวันหมดอายุ (${expiry.date})`,
    };
  }
  if (expiry.daysLeft <= 0) {
    return {
      ...base,
      value: null,
      status: "expired",
      detail:
        expiry.daysLeft === 0
          ? `หมดอายุวันนี้ (${expiry.date})`
          : `หมดอายุแล้ว ${Math.abs(expiry.daysLeft)} วัน (${expiry.date})`,
    };
  }
  return {
    ...base,
    // Nothing at all on a pass. The tick says "Yes", and the review date is a
    // fact about a record that is currently fine — it belongs on the client's
    // own KYC tab, not in the way of a booking. The dates that *do* appear
    // above are the ones explaining a failure.
    value: null,
    status: "passed",
    detail: null,
  };
}

/**
 * The Risk Profile row — two different failures that must not read alike.
 *
 * No assessment on file reads "NOT FOUND", which is a thing Risk Consent can
 * fix. An assessment that is on file but below what the product asks for reads
 * as the rating itself, because the record is there and has just been compared
 * — and nothing the client signs changes the answer, so that row is never part
 * of a request (see {@link requestableKeys}).
 *
 * Every branch is a classification: the rating *is* the answer here, so the
 * form shows it in place of a status icon rather than beside one.
 */
function riskItem(client: Client, product: BookableProduct): RequirementItem {
  const base = {
    key: "risk-profile" as const,
    ...REQUIREMENT_CATALOG["risk-profile"],
  };
  const required = requiredRiskProfile(product);

  if (!client.riskProfile) {
    return { ...base, value: "NOT FOUND", status: "missing", detail: null };
  }
  if (riskRank(client.riskProfile) < riskRank(required)) {
    return {
      ...base,
      value: client.riskProfile,
      status: "failed",
      // Kept, unlike the passing case below: a rating on its own does not say
      // why it is not enough, and that is the whole of what is wrong here.
      detail: `ต่ำกว่าระดับ ${required} ที่ผลิตภัณฑ์ต้องการ`,
    };
  }
  return {
    ...base,
    // The rating alone. What the product asks for only matters when the client
    // falls short of it — on a pass it is a specification nobody needs, next to
    // a rating that already clears it.
    value: client.riskProfile,
    status: "passed",
    detail: null,
  };
}

/**
 * Where a book's own requirement requests override the stored status.
 *
 * A request that has come back `completed` means the client has just done the
 * thing in another system and the record here has not caught up — which is
 * exactly the state this flow exists to move through. Treating the completed
 * request as the newer fact is what lets the IC re-open the form and get a
 * different answer without the fixture being edited.
 */
function statusAfterRequests(
  stored: RequirementStatus,
  key: RequirementKey,
  requests: RequirementRequest[],
): RequirementStatus {
  const completed = requests.some((r) => r.status === "completed" && r.keys.includes(key));
  if (completed) return "passed";
  const sent = requests.some((r) => r.status === "sent" && r.keys.includes(key));
  // Already asked for and not back yet — "Pending", not "No".
  return sent && stored !== "passed" ? "pending" : stored;
}

/**
 * The full checklist for one client against one product, plus the verdict.
 *
 * `requests` is scoped by the caller to this client and product. It is passed
 * in rather than read from a store here so this stays a pure function — the
 * booking form, the client dropdown's per-row badge and the guard on the submit
 * button all call it, and only one of them is inside a provider.
 */
export function clientReadiness(
  client: Client,
  product: BookableProduct,
  requests: RequirementRequest[],
): ClientReadiness {
  const items = productRequirementKeys(product).map((key): RequirementItem => {
    if (key === "kyc") return kycItem(client.id);
    if (key === "risk-profile") return riskItem(client, product);

    const stored = mockClientRequirements[client.id]?.[key] ?? "missing";
    return storedItem(key, statusAfterRequests(stored, key, requests));
  });

  const outstanding = items.filter((i) => i.status !== "passed");
  return {
    clientId: client.id,
    status:
      outstanding.length === 0
        ? "ready"
        : // Everything left is waiting on someone else, so there is nothing to
          // send the client — the IC's move is to wait, not to nudge.
          outstanding.every((i) => i.status === "pending")
          ? "in-review"
          : "blocked",
    items,
    outstanding,
  };
}

/**
 * The outstanding rows a request can actually do something about — what the
 * form's "ส่งให้ลูกค้าดำเนินการ" button sends, and whether it appears at all.
 *
 * Three exclusions, for three different reasons. A row that is not
 * `selfService` has nowhere to send the client (KYC). A `pending` row has
 * already been asked for. A `failed` risk profile is on file and simply too low
 * — no consent the client gives moves it. Sending any of them would be asking
 * for something that cannot be done, which is worse than not asking.
 */
export function requestableKeys(readiness: ClientReadiness): RequirementKey[] {
  return readiness.outstanding
    .filter((i) => i.selfService && i.status !== "pending" && i.status !== "failed")
    .map((i) => i.key);
}
