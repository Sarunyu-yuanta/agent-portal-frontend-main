"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Checkbox } from "@sarunyu/system-one";
import {
  CheckIcon,
  CopySimpleIcon,
  EnvelopeSimpleIcon,
  LinkSimpleIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { TierBadge } from "@/components/ui/tier-badge";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { getInitials } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type { CampaignClientRow } from "@/features/promotions/lib/campaign-data";
import { useT } from "@/i18n/I18nProvider";
import type { CampaignMaterial } from "@/types/campaign";

/**
 * Pick who one piece of material goes to.
 *
 * Sharing used to be spread across three places — a button on each material, a
 * "เลือกสำหรับส่งหลายคน" selection that armed the material, and a second share
 * button on the clients table further down the page. Sending anything meant
 * holding a selection in your head while scrolling between the two. This is
 * the whole of it instead: press share on a material, tick the clients, send.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * The send itself is a concept. `shareMaterial` in `contexts/campaigns-context`
 * records who it went to and writes the compliance log; what it does *not* do
 * is deliver anything, because there is no mail service behind this yet. The
 * dialog says so in as many words rather than implying a mail has gone out.
 * When that service exists, this screen does not change — the store's mutator
 * is where it lands.
 */
export function ShareDialog({
  open,
  onOpenChange,
  rows,
  mode = "share",
  joinUrl,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The material being sent. No longer shown; the share logs it. */
  material: CampaignMaterial | null;
  /** Everyone the campaign concerns; only the eligible, unredeemed are listed. */
  rows: CampaignClientRow[];
  /** `invite` is the event wording — "ชวน" rather than "แชร์". */
  mode?: "share" | "invite";
  /** An online event's link, shown with a copy button above the list. */
  joinUrl?: string;
  /** Resolves `true` once sent; `false` keeps the dialog open with the picks intact. */
  onConfirm: (clientIds: string[]) => Promise<boolean>;
}) {
  const t = useT();
  const s = t.campaigns.share;
  const verb = mode === "invite" ? t.campaigns.detail.invite : t.campaigns.detail.share;
  const verbCount = mode === "invite" ? s.inviteCount : s.shareCount;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyLink = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions); the link is
      // still on screen to select by hand.
    }
  };

  const { isPrivate } = usePrivacy();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  /**
   * Closing clears the ticks, so the next material never inherits them.
   *
   * On the way out rather than on the way in: resetting when `open` turns true
   * means a `setState` inside an effect, which costs a second render pass and
   * is what `react-hooks/set-state-in-effect` is there to catch. Same result,
   * no cascade.
   */
  const setOpen = (next: boolean) => {
    if (!next) setPicked(new Set());
    onOpenChange(next);
  };

  /** Only who can still use it — the ineligible and the already-redeemed are left out. */
  const eligibleRows = useMemo(
    () => rows.filter((row) => row.eligible && row.status !== "redeemed"),
    [rows],
  );
  const selectable = useMemo(() => eligibleRows.map((row) => row.client.id), [eligibleRows]);

  const allPicked = selectable.length > 0 && picked.size === selectable.length;

  const toggle = (id: string, next: boolean) =>
    setPicked((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={verb}
      closeOnBackdrop
      desktopContentClassName="w-[460px] max-w-full"
    >
      <div className="flex flex-col gap-4 pt-1">
        {joinUrl && (
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 py-1.5 pr-1.5 pl-3">
            <LinkSimpleIcon size={16} weight="bold" className="text-primary-action shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-meta text-muted-foreground">{s.joinLink}</span>
              <span className="truncate text-label font-medium text-foreground">{joinUrl}</span>
            </div>
            <Button
              variant="plain"
              size="icon-sm"
              aria-label={copied ? s.copied : s.copyLink}
              title={copied ? s.copied : s.copyLink}
              onClick={() => void copyLink()}
              className="shrink-0"
            >
              {copied ? (
                <CheckIcon size={16} weight="bold" />
              ) : (
                <CopySimpleIcon size={16} weight="bold" />
              )}
            </Button>
          </div>
        )}

        {selectable.length > 0 && (
          <div className="-mb-1 flex items-center justify-between pl-1">
            <span className="text-label font-semibold text-muted-foreground">{s.clientList}</span>
            <Button
              variant="plain"
              size="sm"
              onClick={() => setPicked(allPicked ? new Set() : new Set(selectable))}
            >
              {allPicked ? s.clearPicked : s.pickAll}
            </Button>
          </div>
        )}

        <div className="-mx-1 flex max-h-[calc(var(--vh)*46)] flex-col gap-2 overflow-y-auto px-1 py-0.5">
          {eligibleRows.length === 0 && (
            <p className="rounded-xl bg-muted/40 px-4 py-6 text-center text-label text-muted-foreground">
              {s.noneEligible}
            </p>
          )}
          {eligibleRows.map((row) => {
            const name = maskName(row.client.name, isPrivate);
            const checked = picked.has(row.client.id);
            return (
              <label
                key={row.client.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                  checked
                    ? "border-primary-action/40 bg-primary-action-light"
                    : "border-border/60 hover:border-border hover:bg-muted/40"
                }`}
              >
                <Checkbox checked={checked} onChange={(next) => toggle(row.client.id, next)} />
                <Avatar type="text" initials={getInitials(name)} size="s" />
                <span className="min-w-0 flex-1 truncate text-body-sm font-semibold text-foreground">
                  {name}
                </span>
                <TierBadge tier={row.client.membershipTier} className="shrink-0" />
              </label>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {/* Said plainly, because it is not true yet: the record is written,
              the mail is not sent. */}
          <p className="flex items-start gap-1.5 text-label leading-snug text-muted-foreground">
            <EnvelopeSimpleIcon size={14} className="mt-0.5 shrink-0" />
            {s.backendNote}
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            leftIcon={<PaperPlaneTiltIcon size={16} weight="fill" />}
            disabled={picked.size === 0 || sending}
            onClick={async () => {
              // Closed only once it has gone through — closing first lost the
              // IC's picks whenever the send failed.
              setSending(true);
              try {
                if (await onConfirm([...picked])) setOpen(false);
              } finally {
                setSending(false);
              }
            }}
          >
            {sending ? s.sending : picked.size > 1 ? verbCount(picked.size) : verb}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
