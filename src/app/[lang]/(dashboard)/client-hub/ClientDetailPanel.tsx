"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Avatar, Button } from "@sarunyu/system-one";
import {
  PhoneListIcon,
  PhoneIncomingIcon,
  PhoneOutgoingIcon,
  UserIcon,
  NotePencilIcon,
  BellIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react";
import { getCallLogs, relativeCallDate, type CallLogEntry } from "@/data/call-log-data";
import { ClientRemindersTab } from "../client/[id]/ClientRemindersTab";
import { kycExpiryLabelTh } from "../client/[id]/client-detail-data";
import { useClients } from "@/hooks/use-api";
import { useNotes } from "@/contexts/notes-context";
import { useNoteEditModal } from "../calendar/use-note-edit-modal";
import { formatDayOnly, formatListStamp } from "../notes/note-format";
import { snippet } from "../notes/notes-grouping";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitials } from "@/lib/client-utils";
import {
  CALL_LOG_ENABLED,
  NOTES_ENABLED,
  REMINDERS_ENABLED,
} from "@/lib/feature-flags";
import { useSlideOver, SlideOverPanel } from "@/components/ui/slide-over";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { CompactList } from "@/components/ui/compact-list";
import { ClientAssetSidebarContent, type AssetListViewMode } from "@/components/ClientAssetSidebarContent";
import { HoldingDetailContent } from "@/components/HoldingDetailContent";
import { LiabilitiesDetailContent } from "@/components/LiabilitiesDetailModal";
import type { LiabilitiesDetail } from "@/data/liabilities-details";
import { TierBadge } from "@/components/ui/tier-badge";
import {
  getAssetAccountDetail,
  getAssetProductDetail,
  type AssetAccountItem,
} from "@/data/asset-account-details";
import type { Client } from "@/types/domain";

export function ClientDetailPanel({
  client,
  onViewFull,
  onViewCallLog,
  onViewReminders,
  onViewNotes,
  onBack,
}: {
  client: Client;
  onViewFull: () => void;
  /** "View all" past each compact list's scroll cap — the matching full tab
   *  on that client's own profile page. */
  onViewCallLog?: () => void;
  onViewReminders?: () => void;
  onViewNotes?: () => void;
  onBack?: () => void;
}) {
  const { isPrivate } = usePrivacy();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const detail = useSlideOver<{ item: AssetAccountItem; viewMode: AssetListViewMode }>();
  const liabilities = useSlideOver<{ amount: string; detail: LiabilitiesDetail }>();
  const [callLogOpen, setCallLogOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const callLogs = getCallLogs(client.id);
  const kycExpiryLabel = kycExpiryLabelTh(client.id);
  const clients = useClients();
  const { notes } = useNotes();
  const { openNote, modal: noteModal } = useNoteEditModal({ clients, pinnedClientId: client.id });
  const clientNotes = notes
    .filter((n) => n.clientIds.includes(client.id))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const { reset: resetDetail } = detail;
  const { reset: resetLiabilities } = liabilities;
  const [prevClientId, setPrevClientId] = useState(client.id);
  if (prevClientId !== client.id) {
    setPrevClientId(client.id);
    setCompact(false);
    resetDetail();
    resetLiabilities();
  }
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [client.id]);

  const holdingDetail = detail.data
    ? detail.data.viewMode === "account"
      ? getAssetAccountDetail(detail.data.item.accountNo)
      : getAssetProductDetail(detail.data.item.name)
    : null;

  const detailTitle = holdingDetail?.viewByLabel.replace(/^view by /i, "") ?? "";

  const handleScroll = useCallback(() => {
    const top = scrollRef.current?.scrollTop ?? 0;
    setCompact((prev) => {
      if (prev && top <= 4) return false;
      if (!prev && top > 12) return true;
      return prev;
    });
  }, []);

  const callLogCards = (
    <>
      {callLogs.map((log: CallLogEntry) => (
        <div key={log.id} className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="type-body-2 text-foreground font-semibold">{log.date} · {log.time}</span>
            <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
              {log.direction === "outbound" ? (
                <PhoneOutgoingIcon size={14} className="text-[var(--text-brand-primary)]" />
              ) : (
                <PhoneIncomingIcon size={14} className="text-[var(--icon-success)]" />
              )}
              <span className="type-caption">{log.direction === "outbound" ? "Outbound" : "Inbound"}</span>
            </div>
          </div>
          <p className="type-caption text-muted-foreground">{relativeCallDate(log.date)} · {log.duration}</p>
          <p className="type-body-2 text-foreground mt-1">{log.summary}</p>
        </div>
      ))}
      {callLogs.length === 0 && (
        <p className="type-body-2 text-muted-foreground text-center py-6">No call history yet.</p>
      )}
    </>
  );

  /**
   * The panel's shortcut row. All three tiles are out of the current delivery
   * phase (see `lib/feature-flags`) — hence a list rather than three tiles
   * written into the markup: the column count follows its length, and at zero
   * the row itself stops rendering instead of leaving a gap above "View Full
   * Profile" where a `grid-cols-3` used to be.
   *
   * `comingSoon` marks a tile that shows but can't be clicked. That's a
   * different thing from a phase gate: it's for a feature the user is meant to
   * know is on the way, where a gated one isn't advertised at all.
   */
  const quickActions = [
    ...(CALL_LOG_ENABLED
      ? [{ icon: <PhoneListIcon size={20} />,  label: "Call log", onClick: () => setCallLogOpen(true),   comingSoon: false }]
      : []),
    ...(REMINDERS_ENABLED
      ? [{ icon: <BellIcon size={20} />,       label: "Reminder", onClick: () => setRemindersOpen(true), comingSoon: false }]
      : []),
    ...(NOTES_ENABLED
      ? [{ icon: <NotePencilIcon size={20} />, label: "Notes",    onClick: () => setNotesOpen(true),     comingSoon: false }]
      : []),
  ];

  // Spelled out, not built as `grid-cols-${n}` — Tailwind only emits classes
  // it can see as literal text in the source.
  const quickActionCols =
    quickActions.length >= 3 ? "grid-cols-3" : quickActions.length === 2 ? "grid-cols-2" : "grid-cols-1";

  const noteCards = (
    <>
      {clientNotes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => openNote(note.id)}
          className="flex flex-col gap-1.5 rounded-xl border border-border p-3 text-left transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="type-body-2 text-foreground font-semibold truncate">
              {note.title || "Untitled note"}
            </span>
            {note.reminderAt && (
              <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                <BellIcon size={14} />
                <span className="type-caption">{formatDayOnly(note.reminderAt)}</span>
              </div>
            )}
          </div>
          <p className="type-caption text-muted-foreground">{formatListStamp(note.updatedAt)}</p>
          <p className="type-body-2 text-foreground mt-1">
            {note.body ? snippet(note.body, 80) : "No additional text"}
          </p>
        </button>
      ))}
      {clientNotes.length === 0 && (
        <p className="type-body-2 text-muted-foreground text-center py-6">No notes yet.</p>
      )}
    </>
  );

  return (
    <>
    <div className="flex flex-col h-full relative overflow-hidden">
      <div
        className={`flex flex-col shrink-0 border-b border-[var(--border-default)] transition-[padding,gap] duration-300 ease-out ${
          compact ? "px-5 py-3 gap-0" : "px-5 pt-5 pb-4 gap-4"
        }`}
      >
        <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center size-8 rounded-lg hover:bg-[var(--bg-default-secondary)] transition-colors text-[var(--text-default-primary)] cursor-pointer shrink-0"
              aria-label="Go back"
            >
              <ArrowLeftIcon size={20} />
            </button>
          )}
          <Avatar
            type="text"
            initials={getInitials(maskName(client.name, isPrivate))}
            size={compact ? "s" : "l"}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={`text-foreground leading-tight transition-all duration-300 ${
                  compact ? "type-subtitle-2 font-bold" : "type-subtitle-1"
                }`}
              >
                {maskName(client.name, isPrivate)}
              </p>
              {!compact && <TierBadge tier={client.membershipTier} />}
            </div>
            {/* Same pairing as the full profile's identity bar — client id
                plus the KYC countdown, dropped when the client has no KYC
                record. Hidden while compact: that row also has to hold the
                "View Full Profile" button. */}
            {/* Tighter once compact: at full size the name row carries the
                tier badge, so the id needs clearance from it — collapsed it's
                two plain lines of text and `mt-2` reads as a gap. */}
            <div className={`flex items-center gap-2 ${compact ? "mt-0.5" : "mt-2"}`}>
              <p className="type-caption text-muted-foreground">{client.id}</p>
              {!compact && kycExpiryLabel && (
                <span className="type-caption text-muted-foreground rounded-md bg-muted px-2 py-0.5">
                  {kycExpiryLabel}
                </span>
              )}
            </div>
          </div>
          {compact ? (
            <Button
              variant="primary"
              size="sm"
              className="shrink-0 mr-8 whitespace-nowrap"
              leftIcon={<UserIcon size={14} />}
              onClick={onViewFull}
            >
              View Full Profile
            </Button>
          ) : (
            <div className="w-10 shrink-0" />
          )}
        </div>

        {/* Gone entirely, not left empty: this header is a `gap-4` stack, so an
            empty row here would still spend a gap between the client's name and
            "View Full Profile". */}
        {quickActions.length > 0 && (
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            compact ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="overflow-hidden min-h-0">
            {/* Reminders before Notes — same order as the Client 360 page's
                own tabs, so the two surfaces agree on which comes first. */}
            <div className={`grid ${quickActionCols} gap-2`}>
              {quickActions.map(({ icon, label, onClick, comingSoon }) => (
                <button
                  key={label}
                  onClick={comingSoon ? undefined : onClick}
                  disabled={comingSoon}
                  className={`relative flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border bg-[var(--bg-default-secondary)] border-primary-action/20 transition-colors overflow-hidden ${
                    comingSoon
                      ? "cursor-not-allowed"
                      : "hover:bg-[var(--bg-brand-light)] hover:border-[var(--bg-brand-primary)] cursor-pointer"
                  }`}
                >
                  <span className={`text-primary-action ${comingSoon ? "opacity-40" : ""}`}>{icon}</span>
                  <span className={`text-meta font-medium text-primary-action leading-none ${comingSoon ? "opacity-40" : ""}`}>
                    {label}
                  </span>
                  {comingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-default-secondary)]/70">
                      <span className="text-meta font-semibold text-primary-action bg-[var(--bg-brand-light)] border border-primary-action/30 px-1.5 py-0.5 rounded-full">Coming soon</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            compact ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              leftIcon={<UserIcon size={16} />}
              onClick={onViewFull}
            >
              View Full Profile
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto hide-scrollbar"
      >
        <ClientAssetSidebarContent
          clientId={client.id}
          client={client}
          onItemClick={(item, viewMode) => detail.open({ item, viewMode })}
          onLiabilitiesOpen={(amount, detailData) => liabilities.open({ amount, detail: detailData })}
        />
      </div>

      {/* Detail view — covers entire panel including sticky header */}
      {detail.mounted && holdingDetail && (
        <SlideOverPanel visible={detail.visible}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)] shrink-0">
            <button
              type="button"
              onClick={detail.close}
              className="flex items-center justify-center size-8 rounded-lg hover:bg-[var(--bg-default-secondary)] transition-colors text-[var(--text-default-primary)] cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeftIcon size={20} />
            </button>
            <p className="type-subtitle-2 font-bold text-[var(--text-default-primary)] flex-1 min-w-0 truncate">
              {detailTitle}
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
            <HoldingDetailContent detail={holdingDetail} />
          </div>
        </SlideOverPanel>
      )}

      {/* Liabilities view — same slide-in pattern */}
      {liabilities.mounted && liabilities.data && (
        <SlideOverPanel visible={liabilities.visible}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)] shrink-0">
            <button
              type="button"
              onClick={liabilities.close}
              className="flex items-center justify-center size-8 rounded-lg hover:bg-[var(--bg-default-secondary)] transition-colors text-[var(--text-default-primary)] cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeftIcon size={20} />
            </button>
            <p className="type-subtitle-2 font-bold text-[var(--text-default-primary)] flex-1 min-w-0 truncate">
              Liabilities
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
            <div className="flex flex-col gap-4 p-4">
              <LiabilitiesDetailContent
                totalAmount={liabilities.data.amount}
                detail={liabilities.data.detail}
              />
            </div>
          </div>
        </SlideOverPanel>
      )}
    </div>

    {/* Call log — BottomSheet on mobile, Modal on tablet/desktop */}
    {CALL_LOG_ENABLED && (
    <ResponsiveDialog
      open={callLogOpen}
      onOpenChange={setCallLogOpen}
      title={`Call log — ${client.name}`}
      mobileContentClassName="flex flex-col gap-3 p-4"
      desktopContentClassName="flex flex-col gap-3 min-w-[420px] max-w-[520px]"
    >
      <CompactList
        onViewAll={
          callLogs.length > 0 && onViewCallLog
            ? () => {
                setCallLogOpen(false);
                onViewCallLog();
              }
            : undefined
        }
      >
        {callLogCards}
      </CompactList>
    </ResponsiveDialog>
    )}

    {/* Reminder — `compact` keeps this to the card list `ClientRemindersTab`
        already draws below `md` on the Client 360 page, so it reads as the
        same shape as the Call Log dialog right above rather than switching to
        the wider table. Same width as that dialog for the same reason. */}
    {REMINDERS_ENABLED && (
    <ResponsiveDialog
      open={remindersOpen}
      onOpenChange={setRemindersOpen}
      title={`Reminders — ${client.name}`}
      mobileContentClassName="flex flex-col gap-3 p-4"
      desktopContentClassName="flex flex-col gap-3 min-w-[420px] max-w-[520px]"
    >
      <ClientRemindersTab
        clientId={client.id}
        compact
        onViewAll={
          onViewReminders &&
          (() => {
            setRemindersOpen(false);
            onViewReminders();
          })
        }
      />
    </ResponsiveDialog>
    )}

    {/* Notes — same card-list shape as Call Log and Reminders rather than the
        Notes tab's full gallery/editor: a note opens in place through
        `NoteEditModal`, the same modal the Reminders dialog already opens a
        note into, so it looks like itself wherever it's found. */}
    {NOTES_ENABLED && (
    <ResponsiveDialog
      open={notesOpen}
      onOpenChange={setNotesOpen}
      title={`Notes — ${client.name}`}
      mobileContentClassName="flex flex-col gap-3 p-4"
      desktopContentClassName="flex flex-col gap-3 min-w-[420px] max-w-[520px]"
    >
      <CompactList
        onViewAll={
          clientNotes.length > 0 && onViewNotes
            ? () => {
                setNotesOpen(false);
                onViewNotes();
              }
            : undefined
        }
      >
        {noteCards}
      </CompactList>
    </ResponsiveDialog>
    )}

    {NOTES_ENABLED && noteModal}
    </>
  );
}
