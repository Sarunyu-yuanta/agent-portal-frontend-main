/**
 * The channels a Proposal can go down, in the order the send dialog lists them.
 *
 * One table for the dialog's picker and for every place a sent proposal shows
 * where it went (`ProposalDetailModal`), so a channel cannot be called one
 * thing when chosen and another when read back.
 *
 * YSInvest and Voice AI are `comingSoon`: listed so the IC knows they are on
 * the way, but they can't be picked yet. They sit together at the end, after
 * the channels that work. Nothing is ticked by default; a send needs at least
 * one channel.
 */

import type { ElementType } from "react";
import {
  ChatCircleTextIcon,
  DeviceMobileIcon,
  EnvelopeSimpleIcon,
  WaveformIcon,
} from "@phosphor-icons/react";
import type { ProposalChannel } from "@/types/order";

export const PROPOSAL_CHANNEL_ORDER: ProposalChannel[] = ["email", "line", "app", "voice-ai"];

export const PROPOSAL_CHANNEL_META: Record<
  ProposalChannel,
  {
    label: string;
    /** One line under the label in the picker — what the client gets. */
    Icon: ElementType;
    /** Icon colour in the picker. */
    color: string;
    /** Not available yet: listed, labelled "Coming Soon", cannot be ticked. */
    comingSoon?: boolean;
  }
> = {
  app: {
    label: "YSInvest",
    Icon: DeviceMobileIcon,
    color: "#0a6ee7",
    comingSoon: true,
  },
  email: {
    label: "Email",
    Icon: EnvelopeSimpleIcon,
    color: "#6a7282",
  },
  line: {
    label: "Line",
    Icon: ChatCircleTextIcon,
    color: "#06c755",
  },
  "voice-ai": {
    label: "Voice AI",
    Icon: WaveformIcon,
    color: "#7c3aed",
    comingSoon: true,
  },
};

/** The channels that can be picked today, in list order. */
export const AVAILABLE_PROPOSAL_CHANNELS: ProposalChannel[] = PROPOSAL_CHANNEL_ORDER.filter(
  (c) => !PROPOSAL_CHANNEL_META[c].comingSoon,
);
