"use client";

import { useEffect, useRef, useState } from "react";

import { TextArea, UploadArea, UploadItem } from "@sarunyu/system-one";
import { CheckCircleIcon, PhoneIncomingIcon, PhoneOutgoingIcon } from "@phosphor-icons/react";
import {
  EVIDENCE_CHANNEL,
  EVIDENCE_CHANNELS,
  formatFileSize,
  noteRequired,
} from "@/features/orders/components/order-evidence";
import { useClientCallLogs } from "@/features/clients/hooks/use-clients";
import { useT } from "@/i18n/I18nProvider";
import type { EvidenceChannel, OrderEvidence } from "@/types/order";

// ── Evidence ─────────────────────────────────────────────────────────────────

/**
 * The proof that the client asked for this — every bookable desk.
 *
 * Two steps and they are in this order on purpose: the channel decides which
 * files are even offered (`EVIDENCE_CHANNEL[...].accept`), so there is no file
 * field until a channel is chosen. A field that took anything would be a field
 * that took the wrong thing — a chat screenshot filed under "โทรศัพท์" is a log
 * that lies about the one fact it exists to record.
 *
 * Faded until the four checks pass, exactly as the amount is: this is gated on
 * the same thing, and the IC should see it is coming without it being open yet.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * The `File` goes no further than this component — see `OrderEvidence`. What
 * leaves is its name, size and type, and the note at the foot says so rather
 * than implying the recording has been filed somewhere.
 */
export function EvidenceSection({
  clientId,
  value,
  onChange,
}: {
  /** Whose Call Log the phone channel offers. */
  clientId: string;
  value: OrderEvidence | null;
  onChange: (next: OrderEvidence | null) => void;
}) {
  const t = useT();
  const [channel, setChannel] = useState<EvidenceChannel | null>(null);
  /** Phone only: pick the call off the Call Log, or attach the recording. */
  const [callSource, setCallSource] = useState<"call-log" | "file">("call-log");
  // Kept here as well as on the evidence: the IC may write it before choosing
  // the proof, and switching channel clears the proof but not what they wrote.
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  /**
   * The file being "uploaded" — shown as the library's loading UploadItem
   * until it lands as the evidence. There is no upload endpoint yet (see
   * `OrderEvidence`), so the progress is a short stand-in; the backend's own
   * progress replaces the timer.
   */
  const [uploading, setUploading] = useState<{
    name: string;
    size: number;
    progress: number;
  } | null>(null);
  const uploadTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadDone = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Stops an in-flight upload — on delete, on a new file, on unmount. */
  const stopUpload = () => {
    if (uploadTimer.current) clearInterval(uploadTimer.current);
    if (uploadDone.current) clearTimeout(uploadDone.current);
    uploadTimer.current = null;
    uploadDone.current = null;
  };
  useEffect(() => stopUpload, []);
  const chosen = channel ? EVIDENCE_CHANNEL[channel] : null;
  const { data: calls } = useClientCallLogs(clientId);
  const byLog = channel === "call" && callSource === "call-log";

  const clearProof = () => {
    // A file attached under one channel is not evidence of another, so
    // switching clears it rather than re-labelling it.
    stopUpload();
    setUploading(null);
    onChange(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const pickChannel = (next: EvidenceChannel) => {
    if (next === channel) return;
    setChannel(next);
    setCallSource("call-log");
    clearProof();
  };

  const pickCallSource = (next: "call-log" | "file") => {
    if (next === callSource) return;
    setCallSource(next);
    clearProof();
  };

  const withNote = (e: OrderEvidence): OrderEvidence => {
    const trimmed = note.trim();
    return trimmed ? { ...e, note: trimmed } : e;
  };

  const attach = (file: File | undefined) => {
    if (!file || !channel) return;
    // A new file replaces the one there: one proof per booking.
    clearProof();
    const forChannel = channel;
    setUploading({ name: file.name, size: file.size, progress: 0 });
    uploadTimer.current = setInterval(() => {
      setUploading((u) => (u ? { ...u, progress: Math.min(100, u.progress + 25) } : u));
    }, 150);
    uploadDone.current = setTimeout(() => {
      stopUpload();
      setUploading(null);
      onChange(
        withNote({
          channel: forChannel,
          source: "file",
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          attachedAt: new Date().toISOString(),
        }),
      );
    }, 700);
  };

  const pickCall = (call: (typeof calls)[number]) =>
    onChange(
      withNote({
        channel: "call",
        source: "call-log",
        callLog: { ...call },
        attachedAt: new Date().toISOString(),
      }),
    );

  const changeNote = (next: string) => {
    setNote(next);
    if (!value) return;
    const trimmed = next.trim();
    const rest = { ...value };
    delete rest.note;
    onChange(trimmed ? { ...rest, note: trimmed } : rest);
  };

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className="type-body-2 !font-semibold text-foreground">
          {t.orders.evidenceForm.title}
        </span>
        {/* Said once, here, rather than only by a disabled button: the IC
            should know it is required before they go looking for the file. */}
        <span className="type-caption text-[var(--fill-red-600)]">
          {t.orders.evidenceForm.required}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {/* Cards across the modal rather than a row of chips. Chips read as a
            *filter* — something narrowing a list already on screen — and this
            is a choice the IC has to make before anything below it exists.
            Equal widths, because none of them is the expected one. */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EVIDENCE_CHANNELS.map((c) => {
            const meta = EVIDENCE_CHANNEL[c];
            const Icon = meta.icon;
            const on = channel === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => pickChannel(c)}
                className={`flex h-[84px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border px-2 text-center transition-colors focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none ${
                  on
                    ? "border-primary-action bg-primary-action-light"
                    : "border-border bg-white hover:border-[var(--border-hover)] hover:bg-[var(--bg-default-secondary)]"
                }`}
              >
                <Icon
                  size={22}
                  weight="fill"
                  className={`shrink-0 ${on ? "text-primary-action" : "text-muted-foreground"}`}
                />
                <span
                  className={`type-body-2 leading-tight !font-semibold ${
                    on ? "text-primary-action" : "text-foreground"
                  }`}
                >
                  {t.orders.evidence[c].label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Phone has two kinds of proof. The Call Log comes first: it is
            already on file and needs nothing from the IC but a pick. */}
        {channel === "call" && (
          <div className="flex gap-1 rounded-lg bg-[var(--bg-default-secondary)] p-1">
            {(
              [
                { id: "call-log", label: t.orders.evidenceForm.fromCallLog },
                { id: "file", label: t.orders.evidenceForm.attachAudio },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                aria-pressed={callSource === o.id}
                onClick={() => pickCallSource(o.id)}
                className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-body-sm font-semibold transition-colors ${
                  callSource === o.id
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {byLog && (
          <>
            <p className="type-caption text-muted-foreground">{t.orders.evidenceForm.pickCall}</p>
            {calls.length === 0 ? (
              <p className="type-caption rounded-xl border border-dashed border-border px-3 py-4 text-center text-muted-foreground">
                {t.orders.evidenceForm.noCalls}
              </p>
            ) : (
              <div
                role="radiogroup"
                aria-label={t.orders.evidenceForm.callLogAria}
                className="-mx-1 flex max-h-[232px] flex-col gap-2 overflow-y-auto px-1 py-0.5"
              >
                {calls.map((call) => {
                  const on = value?.source === "call-log" && value.callLog?.id === call.id;
                  const Dir = call.direction === "inbound" ? PhoneIncomingIcon : PhoneOutgoingIcon;
                  return (
                    <button
                      key={call.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => pickCall(call)}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        on
                          ? "border-primary-action bg-primary-action-light"
                          : "border-border bg-white hover:border-[var(--border-hover)] hover:bg-[var(--bg-default-secondary)]"
                      }`}
                    >
                      <Dir
                        size={18}
                        weight="fill"
                        className={`mt-0.5 shrink-0 ${on ? "text-primary-action" : "text-muted-foreground"}`}
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="type-body-2 !font-semibold text-foreground">
                          {call.date} · {call.time}
                          <span className="type-caption ml-1.5 !font-normal text-muted-foreground">
                            {t.orders.callDirection[call.direction]} · {call.duration}
                          </span>
                        </span>
                        <span className="type-caption line-clamp-1 text-muted-foreground">
                          {call.summary}
                        </span>
                      </span>
                      {on && (
                        <CheckCircleIcon
                          size={18}
                          weight="fill"
                          className="text-primary-action mt-0.5 shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {chosen && !byLog && (
          <>
            {/* The input itself is never shown: a bare file input cannot be
                styled and reads as a different app. The button in front of it
                is what the IC presses. */}
            <input
              ref={fileRef}
              type="file"
              accept={chosen.accept || undefined}
              className="hidden"
              aria-label={t.orders.evidence[channel!].hint}
              onChange={(e) => attach(e.target.files?.[0])}
            />
            {/* The library's upload pair, as it is meant to be used together:
                the dashed area stays to choose (or drop) a file — a new one
                replaces the last — and the file sits under it as an
                UploadItem, loading and then done, with its own delete. */}
            <UploadArea
              className="mt-2"
              label={
                value?.source === "file"
                  ? t.orders.evidenceForm.changeFile
                  : t.orders.evidenceForm.pickFile
              }
              disabled={uploading !== null}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!uploading) attach(e.dataTransfer.files?.[0]);
              }}
            />
            {/* What to attach, under the area it is attached through. */}
            <p className="type-caption -mt-1.5 text-center text-muted-foreground">
              {t.orders.evidence[channel!].hint}
            </p>
            {uploading ? (
              <UploadItem
                variant="card"
                status="loading"
                fileName={uploading.name}
                fileSize={formatFileSize(uploading.size)}
                progress={uploading.progress}
                onDelete={clearProof}
              />
            ) : value?.source === "file" ? (
              <UploadItem
                variant="card"
                status="success"
                fileName={value.fileName}
                fileSize={value.fileSize != null ? formatFileSize(value.fileSize) : undefined}
                onDelete={clearProof}
              />
            ) : null}
          </>
        )}

        {/* Optional on every channel — what the proof alone does not say: the
            client's exact words, a condition they set, why it came by "other". */}
        {channel && (
          <TextArea
            label={
              noteRequired(channel)
                ? // Typed `string` but rendered as a child, so a node works —
                  // the asterisk needs its own colour.
                  ((
                    <>
                      {t.orders.evidenceForm.note}{" "}
                      <span className="text-[var(--fill-red-600)]">*</span>
                    </>
                  ) as unknown as string)
                : t.orders.evidenceForm.noteOptional
            }
            value={note}
            onChange={changeNote}
            placeholder={
              noteRequired(channel)
                ? t.orders.evidenceForm.notePlaceholderRequired
                : t.orders.evidenceForm.notePlaceholder
            }
            showCount
            maxCount={300}
            // Flagged only once a file is attached: before that the missing
            // file is the first thing to fix, and two errors at once is noise.
            forceState={
              noteRequired(channel) && value !== null && !note.trim() ? "error" : undefined
            }
            errorMessage={t.orders.evidenceForm.noteRequired}
          />
        )}
      </div>
    </div>
  );
}
