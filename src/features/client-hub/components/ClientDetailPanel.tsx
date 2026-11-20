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
import { ClientRemindersTab } from "@/features/client-profile/components/ClientRemindersTab";
import { kycExpiryLabel } from "@/features/client-profile/lib/client-detail-data";
import { useNotes } from "@/features/notes/store/notes-context";
import { ErrorState } from "@/components/ui/empty-state";
import { useNoteEditModal } from "@/features/calendar/hooks/use-note-edit-modal";
import { formatDayOnly, formatListStamp } from "@/features/notes/lib/note-format";
import { snippet } from "@/features/notes/lib/notes-grouping";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitials } from "@/lib/client-utils";
import { CALL_LOG_ENABLED, NOTES_ENABLED, REMINDERS_ENABLED } from "@/config/feature-flags";
import { useSlideOver, SlideOverPanel } from "@/components/ui/slide-over";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { CompactList } from "@/components/ui/compact-list";
import {
  ClientAssetSidebarContent,
  type AssetListViewMode,
} from "@/features/portfolio/components/ClientAssetSidebarContent";
import { HoldingDetailContent } from "@/features/portfolio/components/HoldingDetailContent";
import { LiabilitiesDetailContent } from "@/features/portfolio/components/LiabilitiesDetailModal";
import { TierBadge } from "@/components/ui/tier-badge";
import { useLocale } from "@/i18n/I18nProvider";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types/client";
import type { CallLogEntry } from "@/types/call-log";
import type { AssetAccountItem, LiabilitiesDetail } from "@/types/portfolio";
import { relativeCallDate } from "@/features/clients/lib/call-log-format";
import {
  useClientCallLogs,
  useClients,
  useHoldingDetail,
} from "@/features/clients/hooks/use-clients";

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
  const t = useT();
  const locale = useLocale();
  const { isPrivate } = usePrivacy();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const detail = useSlideOver<{ item: AssetAccountItem; viewMode: AssetListViewMode }>();
  const liabilities = useSlideOver<{ amount: string; detail: LiabilitiesDetail }>();
  const [callLogOpen, setCallLogOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const { data: callLogs } = useClientCallLogs(client.id);
  const kycLine = kycExpiryLabel(client.id, t, locale);
  const clients = useClients();
  const { notes, isLoading: notesLoading, error: notesError, retry: retryNotes } = useNotes();
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

  const holdingDetail = useHoldingDetail(
    detail.data?.viewMode ?? "account",
    detail.data?.item ?? null,
  );

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
            <span className="type-body-2 font-semibold text-foreground">
              {log.date} · {log.time}
            </span>
            <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
              {log.direction === "outbound" ? (
                <PhoneOutgoingIcon size={14} className="text-[var(--text-brand-primary)]" />
              ) : (
                <PhoneIncomingIcon size={14} className="text-[var(--icon-success)]" />
              )}
              <span className="type-caption">
                {log.direction === "outbound"
                  ? t.client.callLog.outbound
                  : t.client.callLog.inbound}
              </span>
            </div>
          </div>
          <p className="type-caption text-muted-foreground">
            {relativeCallDate(log.date, t)} · {log.duration}
          </p>
          <p className="type-body-2 mt-1 text-foreground">{log.summary}</p>
        </div>
      ))}
      {callLogs.length === 0 && (
        <p className="type-body-2 py-6 text-center text-muted-foreground">
          {t.client.panel.noCallHistory}
        </p>
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
      ? [
          {
            icon: <PhoneListIcon size={20} />,
            label: t.client.panel.callLog,
            onClick: () => setCallLogOpen(true),
            comingSoon: false,
          },
        ]
      : []),
    ...(REMINDERS_ENABLED
      ? [
          {
            icon: <BellIcon size={20} />,
            label: t.client.panel.reminder,
            onClick: () => setRemindersOpen(true),
            comingSoon: false,
          },
        ]
      : []),
    ...(NOTES_ENABLED
      ? [
          {
            icon: <NotePencilIcon size={20} />,
            label: t.client.panel.notes,
            onClick: () => setNotesOpen(true),
            comingSoon: false,
          },
        ]
      : []),
  ];

  // Spelled out, not built as `grid-cols-${n}` — Tailwind only emits classes
  // it can see as literal text in the source.
  const quickActionCols =
    quickActions.length >= 3
      ? "grid-cols-3"
      : quickActions.length === 2
        ? "grid-cols-2"
        : "grid-cols-1";

  const noteCards = (
    <>
      {clientNotes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => openNote(note.id)}
          className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-border p-3 text-left transition-colors hover:bg-[var(--bg-default-secondary)]"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="type-body-2 truncate font-semibold text-foreground">
              {note.title || t.client.notes.untitled}
            </span>
            {note.reminderAt && (
              <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                <BellIcon size={14} />
                <span className="type-caption">{formatDayOnly(note.reminderAt, locale)}</span>
              </div>
            )}
          </div>
          <p className="type-caption text-muted-foreground">
            {formatListStamp(note.updatedAt, locale)}
          </p>
          <p className="type-body-2 mt-1 text-foreground">
            {note.body ? snippet(note.body, 80) : t.client.reminders.noAdditionalText}
          </p>
        </button>
      ))}
      {notesLoading ? (
        <p className="type-body-2 py-6 text-center text-muted-foreground">{t.common.loading}</p>
      ) : notesError ? (
        <ErrorState size="compact" title={t.client.notes.loadError} onRetry={retryNotes} />
      ) : (
        clientNotes.length === 0 && (
          <p className="type-body-2 py-6 text-center text-muted-foreground">
            {t.client.notes.noneForClient}
          </p>
        )
      )}
    </>
  );

  return (
    <>
      <div className="relative flex h-full flex-col overflow-hidden">
        <div
          className={`flex shrink-0 flex-col border-b border-[var(--border-default)] transition-[padding,gap] duration-300 ease-out ${
            compact ? "gap-0 px-5 py-3" : "gap-4 px-5 pt-5 pb-4"
          }`}
        >
          <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--text-default-primary)] transition-colors hover:bg-[var(--bg-default-secondary)]"
                aria-label={t.common.back}
              >
                <ArrowLeftIcon size={20} />
              </button>
            )}
            <Avatar
              type="text"
              initials={getInitials(maskName(client.name, isPrivate))}
              size={compact ? "s" : "l"}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`leading-tight text-foreground transition-all duration-300 ${
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
                {!compact && kycLine && (
                  <span className="type-caption rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                    {kycLine}
                  </span>
                )}
              </div>
            </div>
            {compact ? (
              <Button
                variant="primary"
                size="sm"
                className="mr-8 shrink-0 whitespace-nowrap"
                leftIcon={<UserIcon size={14} />}
                onClick={onViewFull}
              >
                {t.client.panel.viewFullProfile}
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
              <div className="min-h-0 overflow-hidden">
                {/* Reminders before Notes — same order as the Client 360 page's
                own tabs, so the two surfaces agree on which comes first. */}
                <div className={`grid ${quickActionCols} gap-2`}>
                  {quickActions.map(({ icon, label, onClick, comingSoon }) => (
                    <button
                      key={label}
                      onClick={comingSoon ? undefined : onClick}
                      disabled={comingSoon}
                      className={`border-primary-action/20 relative flex flex-col items-center gap-1.5 overflow-hidden rounded-xl border bg-[var(--bg-default-secondary)] px-2 py-2.5 transition-colors ${
                        comingSoon
                          ? "cursor-not-allowed"
                          : "cursor-pointer hover:border-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-light)]"
                      }`}
                    >
                      <span className={`text-primary-action ${comingSoon ? "opacity-40" : ""}`}>
                        {icon}
                      </span>
                      <span
                        className={`text-primary-action text-meta leading-none font-medium ${comingSoon ? "opacity-40" : ""}`}
                      >
                        {label}
                      </span>
                      {comingSoon && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-default-secondary)]/70">
                          <span className="text-primary-action border-primary-action/30 rounded-full border bg-[var(--bg-brand-light)] px-1.5 py-0.5 text-meta font-semibold">
                            {t.client.panel.comingSoon}
                          </span>
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
            <div className="min-h-0 overflow-hidden">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                leftIcon={<UserIcon size={16} />}
                onClick={onViewFull}
              >
                {t.client.panel.viewFullProfile}
              </Button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="hide-scrollbar min-h-0 flex-1 overflow-y-auto"
        >
          <ClientAssetSidebarContent
            clientId={client.id}
            client={client}
            onItemClick={(item, viewMode) => detail.open({ item, viewMode })}
            onLiabilitiesOpen={(amount, detailData) =>
              liabilities.open({ amount, detail: detailData })
            }
          />
        </div>

        {/* Detail view — covers entire panel including sticky header */}
        {detail.mounted && holdingDetail && (
          <SlideOverPanel visible={detail.visible}>
            <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border-default)] px-4 py-3">
              <button
                type="button"
                onClick={detail.close}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-[var(--text-default-primary)] transition-colors hover:bg-[var(--bg-default-secondary)]"
                aria-label={t.common.back}
              >
                <ArrowLeftIcon size={20} />
              </button>
              <p className="type-subtitle-2 min-w-0 flex-1 truncate font-bold text-[var(--text-default-primary)]">
                {detailTitle}
              </p>
            </div>
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              <HoldingDetailContent detail={holdingDetail} />
            </div>
          </SlideOverPanel>
        )}

        {/* Liabilities view — same slide-in pattern */}
        {liabilities.mounted && liabilities.data && (
          <SlideOverPanel visible={liabilities.visible}>
            <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border-default)] px-4 py-3">
              <button
                type="button"
                onClick={liabilities.close}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-[var(--text-default-primary)] transition-colors hover:bg-[var(--bg-default-secondary)]"
                aria-label={t.common.back}
              >
                <ArrowLeftIcon size={20} />
              </button>
              <p className="type-subtitle-2 min-w-0 flex-1 truncate font-bold text-[var(--text-default-primary)]">
                {t.client.panel.liabilities}
              </p>
            </div>
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4 p-4">
                <LiabilitiesDetailContent detail={liabilities.data.detail} />
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
          title={t.client.panel.callLogFor(client.name)}
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
          title={t.client.panel.remindersFor(client.name)}
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
          title={t.client.panel.notesFor(client.name)}
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
