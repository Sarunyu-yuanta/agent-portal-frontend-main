/**
 * The channels a Proposal can go down, in the order the send dialog lists them.
 *
 * One table for the dialog's picker and for every place a sent proposal shows
 * where it went (`ProposalDetailModal`), so a channel cannot be called one
 * thing when chosen and another when read back.
 *
 * YSInvest is `required`: the client's app is where the offer is recorded
 * against them, so every proposal lands there and the others are in addition.
 */

import type { ElementType } from "react";
import {
  ChatCircleTextIcon,
  DeviceMobileIcon,
  EnvelopeSimpleIcon,
  WaveformIcon,
} from "@phosphor-icons/react";
import type { ProposalChannel } from "@/types/domain";

export const PROPOSAL_CHANNEL_ORDER: ProposalChannel[] = ["app", "email", "line", "voice-ai"];

export const PROPOSAL_CHANNEL_META: Record<
  ProposalChannel,
  {
    label: string;
    /** One line under the label in the picker — what the client gets. */
    hint: string;
    Icon: ElementType;
    /** Icon colour in the picker. */
    color: string;
    /** Always sent; shown ticked and locked. */
    required?: boolean;
  }
> = {
  app: {
    label: "YSInvest",
    hint: "แจ้งเตือนและเอกสารในแอปของลูกค้า",
    Icon: DeviceMobileIcon,
    color: "#0a6ee7",
    required: true,
  },
  email: {
    label: "Email",
    hint: "ส่งเอกสารแนบไปยังอีเมลของลูกค้า",
    Icon: EnvelopeSimpleIcon,
    color: "#6a7282",
  },
  line: {
    label: "Line",
    hint: "ส่งข้อความพร้อมลิงก์เอกสารทาง LINE",
    Icon: ChatCircleTextIcon,
    color: "#06c755",
  },
  "voice-ai": {
    label: "Voice AI",
    hint: "โทรแนะนำสินค้าให้ลูกค้าด้วยเสียง AI",
    Icon: WaveformIcon,
    color: "#7c3aed",
  },
};

/** The channels every send starts with — the required ones. */
export const DEFAULT_PROPOSAL_CHANNELS: ProposalChannel[] = PROPOSAL_CHANNEL_ORDER.filter(
  (c) => PROPOSAL_CHANNEL_META[c].required,
);
