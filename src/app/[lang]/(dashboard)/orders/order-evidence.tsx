"use client";

/**
 * The channels a client's instruction can arrive down, and what counts as proof
 * of each.
 *
 * One table, because four surfaces ask it the same questions and none of them
 * may answer differently: the picker in the booking form needs the labels, the
 * file input needs the `accept` list, the receipt needs the label and the icon
 * again, and the fixture needs a plausible file name per channel. Writing the
 * extensions twice is how a form comes to accept a file its own receipt cannot
 * describe.
 */

import {
  ChatCircleDotsIcon,
  DotsThreeCircleIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { EvidenceChannel, OrderEvidence } from "@/types/domain";
import type { BookingMode } from "./bookable-products";

export const EVIDENCE_CHANNEL: Record<
  EvidenceChannel,
  {
    label: string;
    /** What to attach, in the IC's words — under the picker. */
    hint: string;
    /**
     * The file input's `accept`.
     *
     * MIME patterns *and* extensions: a `.msg` has no agreed type and macOS
     * reports `.eml` inconsistently, so an extension list is the only thing
     * that reliably offers them. It is a filter, not a check — see the note in
     * `OrderBookingModal`.
     */
    accept: string;
    icon: Icon;
  }
> = {
  call: {
    label: "โทรศัพท์",
    // The file half only — the Call Log half has its own words in the form.
    hint: "ไฟล์เสียงที่อัดไว้ตอนคุยกับลูกค้า",
    accept: "audio/*,.mp3,.wav,.m4a,.aac,.ogg",
    icon: PhoneIcon,
  },
  email: {
    label: "อีเมล",
    // Three forms, because an IC has whichever their mail client gave them and
    // refusing a PDF print would mean refusing the booking. The raw mail is the
    // strongest of the three — it carries headers a screenshot cannot — so it
    // is named first.
    hint: "ไฟล์อีเมล (.eml / .msg) PDF หรือภาพหน้าจอ",
    accept: ".eml,.msg,application/pdf,.pdf,image/*",
    icon: EnvelopeSimpleIcon,
  },
  chat: {
    label: "แชท / LINE",
    hint: "ภาพหน้าจอบทสนทนา หรือไฟล์แชทที่บันทึกไว้",
    accept: "image/*,application/pdf,.pdf,.txt",
    icon: ChatCircleDotsIcon,
  },
  other: {
    label: "อื่นๆ",
    hint: "เอกสารหรือไฟล์อื่นที่ยืนยันคำสั่งของลูกค้า",
    // No filter: "other" is for whatever the three above do not cover, and a
    // list here would only be a guess at what that is.
    accept: "",
    icon: DotsThreeCircleIcon,
  },
};

/** In the order the picker offers them — most common first. */
export const EVIDENCE_CHANNELS: EvidenceChannel[] = ["call", "email", "chat", "other"];

/**
 * Channels whose evidence needs a note to count. "อื่นๆ" is a file the form
 * cannot describe on its own — the note is what says what it is and how the
 * client asked.
 */
export function noteRequired(channel: EvidenceChannel): boolean {
  return channel === "other";
}

/** Whether this evidence is enough to book on: the proof, plus a note where required. */
export function evidenceComplete(e: OrderEvidence | null | undefined): boolean {
  if (!e) return false;
  return !noteRequired(e.channel) || Boolean(e.note?.trim());
}

export const CALL_DIRECTION_LABEL: Record<"inbound" | "outbound", string> = {
  inbound: "สายเข้า",
  outbound: "โทรออก",
};

/**
 * Whether a booking on this desk needs evidence before it can be placed.
 *
 * **Every bookable desk.** Anything the IC books on a client's behalf needs
 * proof the client asked for it — the structured desks and the bond desks
 * alike. It was basket-only at first, on the reasoning that a bond press *is*
 * the order; the requirement since is that whatever can be booked carries
 * evidence.
 *
 * Kept as a function of the mode, though it no longer varies by it: three
 * surfaces ask, and a desk that is ever exempted again is this one line.
 */
export function evidenceRequired(_mode: BookingMode): boolean {
  return true;
}

/** `1536` → `"1.5 KB"`. Rounded to one decimal from KB up; bytes stay whole. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(1)} ${units[unit]}`;
}
