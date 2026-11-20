import type th from "../th/campaigns";
import { plural } from "../../plural";

const clients = (n: number) => `${n} ${plural(n, { one: "client", other: "clients" })}`;
const seats = (n: number) => `${n} ${plural(n, { one: "seat", other: "seats" })}`;

const campaigns = {
  list: {
    all: "All",
    new: "New",
    withCount: (label: string, n: number) => `${label} (${n})`,
    clearFilters: "Clear filters",
    emptyNarrowed: "No matching campaigns",
    emptyPromotion: "No promotions yet",
    emptyEvent: "No seminars or events yet",
    emptyNarrowedPromotionBody: "Try another search, or clear filters to see all promotions.",
    emptyNarrowedEventBody: "Try another search, or clear filters to see all seminars and events.",
    emptyBody: "New campaigns from head office will appear here.",
    newTag: "New",
  },
  filters: {
    all: "All",
    searchPlaceholder: "Search campaigns",
    button: "Filters",
    removeChip: (label: string) => `Remove filter ${label}`,
    clearAll: "Clear all",
    title: "Filters",
    product: "Asset",
    segment: "Client segment",
    format: "Format",
    showResults: (n: number) => `Show results (${n})`,
  },
  detail: {
    notFound: "Campaign not found",
    backToList: "Back to Promotion/Events",
    eventDate: "Event date",
    campaignPeriod: "Campaign period",
    registrationCloses: "Registration closes",
    status: "Status",
    venue: "Venue",
    segment: "Client segment",
    seats: "Seats",
    product: "Asset",
    seatsFull: (total: number) => `Full (${seats(total)})`,
    seatsLeft: (open: number, total: number) => `${open} of ${seats(total)} left`,
    seatsUnlimited: "Unlimited seats",
    full: "Full",
    noApprovedMaterial: "No approved material yet",
    invite: "Invite clients",
    share: "Share with clients",
    download: "Download document",
    sent: (n: number) => `Sent to ${clients(n)} and logged`,
    noneSendable: "None of the selected clients can receive this",
  },
  body: {
    aboutEvent: "About this event",
    agenda: "Agenda",
    by: (speaker: string) => `by ${speaker}`,
    speakers: "Speakers",
    venueAndAttendance: "Venue and attendance",
    totalSeats: (n: number) => ` · ${seats(n)} in total`,
    conditions: "Eligibility conditions",
    terms: "Terms and conditions",
    campaignDetails: "Campaign details",
    disclaimer: "Disclaimer",
  },
  share: {
    joinLink: "Event link",
    copied: "Copied",
    copyLink: "Copy link",
    clientList: "Clients",
    clearPicked: "Clear selection",
    pickAll: "Select all",
    noneEligible: "No clients in this campaign can receive it",
    backendNote:
      "The back office will email the selected clients and keep a log of the send for audit.",
    sending: "Sending…",
    inviteCount: (n: number) => `Invite ${clients(n)}`,
    shareCount: (n: number) => `Share with ${clients(n)}`,
  },
  rules: {
    materialMissing: "This campaign's material can't be found. Refresh the page and try again.",
    materialNotApproved: "This material isn't approved yet, so it can't be sent to clients.",
    campaignClosed: "This campaign has closed and can't be sent to more clients.",
    notEnoughSeats: (open: number, requested: number) =>
      `Only ${seats(open)} left, but ${clients(requested)} selected`,
  },
} satisfies typeof th;

export default campaigns;
