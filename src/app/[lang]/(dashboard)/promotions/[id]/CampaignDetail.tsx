"use client";

import { Fragment, Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarBlankIcon,
  ClockIcon,
  DownloadSimpleIcon,
  MapPinIcon,
  PaperPlaneTiltIcon,
  UsersThreeIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react";
import { Button, Tag, Toaster } from "@sarunyu/system-one";
import { useSectionBack } from "@/hooks/use-section-back";
import { useToasts } from "@/hooks/use-toasts";
import { useClients } from "@/hooks/use-api";
import { useCampaign } from "@/hooks/use-campaigns";
import { useCampaignStore } from "@/contexts/campaigns-context";
import { todayDateKey } from "../../calendar/calendar-grid";
import {
  campaignClientRows,
  campaignDateLine,
  campaignStatus,
  countdownLabel,
  daysUntil,
  FORMAT_LABEL,
  isPastEvent,
  PRODUCT_LABEL,
  SEGMENT_LABEL,
  thaiDay,
} from "../campaign-data";
import { CampaignDetailSkeleton } from "./CampaignDetailSkeleton";
import { EventBody } from "./EventBody";
import { PromotionBody } from "./PromotionBody";
import { ShareDialog } from "./ShareDialog";

/**
 * One campaign, in full.
 *
 * A routed page rather than a drawer, following `/insights/[id]`: the content
 * runs to terms, a materials list and a client table, which is more than a side
 * panel can hold, and a campaign is a thing an IC sends links to.
 *
 * The two kinds share this shell — back button, banner, meta strip, conditions,
 * terms, disclaimer — and differ in the middle: a promotion's body is its offer
 * and its approved artwork, an event's is its agenda, venue and seats. The
 * client table differs with them, because "who can I send this to" and "who is
 * coming" are different tables of the same people.
 */
export function CampaignDetail({ id }: { id: string }) {
  return (
    <Suspense fallback={<CampaignDetailSkeleton />}>
      <CampaignDetailInner id={id} />
    </Suspense>
  );
}

function CampaignDetailInner({ id }: { id: string }) {
  const { data: campaign, isLoading } = useCampaign(id);
  const clients = useClients();
  const {
    campaignClients,
    rsvps,
    shareMaterial,
    seatsLeft,
  } = useCampaignStore();
  const { toasts, addToast, removeToast } = useToasts();
  // Called before any early return — a missing campaign must not skip a hook.
  // No fallback override: `/promotions/` is registered in `sectionRoot`, so a
  // cold entry already lands on the list.
  const goBack = useSectionBack();

  const todayKey = todayDateKey();
  const today = useMemo(() => new Date(todayKey), [todayKey]);

  const [shareOpen, setShareOpen] = useState(false);

  /**
   * What a share actually sends.
   *
   * The page no longer lists the materials, so there is nothing for the IC to
   * choose between — but a `ShareLog` still records a material and a version,
   * because "which version went out" is the question that log exists to
   * answer. The first approved material stands in for the campaign's pack.
   *
   * `undefined` means nothing is approved yet, which is the one case where
   * sharing has to be refused rather than silently logged against nothing.
   */
  const shareable = campaign?.materials.find((m) => m.approved) ?? null;

  /** Saves the same material a share would send. Scripts are text, not a file. */
  const download = useCallback(() => {
    if (!shareable) return;
    const isScript = shareable.type === "script";
    const href = isScript
      ? URL.createObjectURL(new Blob([shareable.url], { type: "text/plain;charset=utf-8" }))
      : shareable.url;
    const a = document.createElement("a");
    a.href = href;
    a.download = isScript
      ? `${shareable.label}-${shareable.version}.txt`
      : shareable.url.split("/").pop() ?? shareable.label;
    a.click();
    if (isScript) URL.revokeObjectURL(href);
  }, [shareable]);

  const rows = useMemo(
    () =>
      campaign
        ? campaignClientRows(campaign, campaignClients, rsvps, clients)
        : [],
    [campaign, campaignClients, rsvps, clients],
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Confirmed from the share dialog: this material, to these clients. */
  const share = useCallback(
    async (materialId: string, clientIds: string[]) => {
      if (!campaign || clientIds.length === 0) return;
      try {
        const written = await shareMaterial({
          campaignId: campaign.id,
          clientIds,
          materialId,
        });
        addToast({
          status: written.length > 0 ? "success" : "warning",
          message:
            written.length > 0
              ? `ส่งให้ลูกค้า ${written.length} รายแล้ว และบันทึกการส่งเรียบร้อย`
              : "ไม่มีลูกค้าที่ส่งได้ในรายการที่เลือก",
        });
      } catch (error) {
        addToast({
          status: "critical",
          message:
            error instanceof Error ? error.message : "ส่งไม่สำเร็จ กรุณาลองใหม่",
        });
      }
    },
    [campaign, shareMaterial, addToast],
  );

  if (isLoading) return <CampaignDetailSkeleton />;

  if (!campaign) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="type-subtitle-1 text-foreground">ไม่พบแคมเปญนี้</p>
        <Link
          href="/promotions"
          className="text-body-sm text-primary-action hover:underline"
        >
          กลับไปหน้า Promotion/Events
        </Link>
      </div>
    );
  }

  const status = campaignStatus(campaign, today);
  const ended = status === "ended";
  const countdown = countdownLabel(campaign, today);
  const isEvent = campaign.type === "event";
  const past = isPastEvent(campaign, today);
  /** Only an online event still to come has a link worth handing out. */
  const joinUrl =
    isEvent && campaign.format === "online" && !past ? campaign.joinUrl : undefined;
  const open = seatsLeft(campaign.id);
  /** No seats left: nothing to invite anyone to. */
  const full = isEvent && open === 0;

  const metaItems: MetaItem[] = [
    {
      icon: <CalendarBlankIcon size={17} weight="fill" />,
      label: isEvent ? "วันจัดงาน" : "ระยะเวลาแคมเปญ",
      labelHint: countdown ?? undefined,
      value:
        isEvent && campaign.eventDate
          ? thaiDay(campaign.eventDate)
          : campaignDateLine(campaign),
    },
    {
      icon: <ClockIcon size={17} weight="fill" />,
      label: isEvent ? "ปิดรับลงทะเบียน" : "สถานะ",
      // An event always carries both dates — see `Campaign.startDate`.
      value: isEvent
        ? thaiDay(campaign.endDate!)
        : statusLine(status, campaign.endDate, today),
    },
    isEvent
      ? {
          icon:
            campaign.format === "online" ? (
              <VideoCameraIcon size={17} weight="fill" />
            ) : (
              <MapPinIcon size={17} weight="fill" />
            ),
          label: campaign.format ? FORMAT_LABEL[campaign.format] : "สถานที่",
          value: campaign.venue ?? "—",
        }
      : {
          icon: <UsersThreeIcon size={17} weight="fill" />,
          label: "กลุ่มลูกค้า",
          value: campaign.segments.map((s) => SEGMENT_LABEL[s]).join(" · "),
        },
    {
      icon: <UsersThreeIcon size={17} weight="fill" />,
      label: isEvent ? "ที่นั่ง" : "สินทรัพย์",
      value: isEvent
        ? campaign.seatsTotal
          ? full
            ? `เต็มแล้ว (${campaign.seatsTotal} ที่นั่ง)`
            : `เหลือ ${open ?? 0} จาก ${campaign.seatsTotal} ที่นั่ง`
          : "ไม่จำกัดที่นั่ง"
        : campaign.products.map((p) => PRODUCT_LABEL[p]).join(" · "),
      critical: full,
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-5 pb-12 sm:gap-6">
        {/* Mobile breadcrumb comes from the layout, above this content. */}
        <Button
          variant="plain"
          size="sm"
          leftIcon={<ArrowLeftIcon size={16} />}
          onClick={goBack}
          className="hidden self-start rounded-full xl:inline-flex"
        >
          กลับ
        </Button>

        {/* Banner + meta share one frame — flush join, radius from the strip below. */}
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-white shadow-[0_8px_32px_-12px_rgba(15,23,42,0.35)]">
          <div className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- the events' covers are generated SVGs, which the image optimizer rejects */}
            <img
              src={campaign.cover}
              alt=""
              className={`h-[200px] w-full object-cover sm:h-[260px] xl:h-[300px] ${
                ended ? "opacity-50 grayscale" : ""
              }`}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10"
            />
            <div
              aria-hidden
              className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-20 left-1/4 size-40 rounded-full bg-primary-action/20 blur-3xl"
            />

            <div className="absolute inset-0 flex flex-col justify-end gap-3.5 p-5 sm:gap-4 sm:p-7">
              {/* A full event says so on its button instead — see below. */}
              {(ended || status === "upcoming") && (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                  {ended ? (
                    <Tag text="หมดเขต" variant="gray" size="large" />
                  ) : (
                    <Tag text="เร็ว ๆ นี้" variant="gray" size="large" />
                  )}
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="flex min-w-0 flex-col gap-3.5 sm:gap-4">
                  <h1 className="max-w-3xl text-[22px] font-bold leading-[1.2] tracking-tight text-white sm:text-[28px] sm:leading-[1.15]">
                    {campaign.title}
                  </h1>
                  <p className="max-w-2xl text-body-sm leading-relaxed text-white/75 sm:text-body-lg">
                    {campaign.summary}
                  </p>
                </div>

                {/* The page's one action, on the banner so it is reachable
                    without scrolling past the terms. Gone until the campaign has
                    opened and once it has closed, and refused outright while nothing is approved —
                    there would be no version to log the send against. */}
                {!ended && status !== "upcoming" && (
                  <div className="flex shrink-0 flex-col gap-2.5 sm:w-52">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      leftIcon={
                        full ? undefined : <PaperPlaneTiltIcon size={16} weight="fill" />
                      }
                      disabled={shareable === null || full}
                      onClick={() => setShareOpen(true)}
                    >
                      {full
                        ? "เต็มแล้ว"
                        : shareable === null
                          ? "ยังไม่มีสื่อที่อนุมัติ"
                          : isEvent
                            ? "ชวนลูกค้า"
                            : "แชร์ให้ลูกค้า"}
                    </Button>
                    {!isEvent && (
                      <Button
                        variant="outline"
                        size="lg"
                        leftIcon={<DownloadSimpleIcon size={16} weight="bold" />}
                        disabled={shareable === null}
                        onClick={download}
                        className="w-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                      >
                        ดาวน์โหลดเอกสาร
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <MetaStrip items={metaItems} attached />
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        {/* One column. The materials panel used to hold the right-hand track;
            with it gone there is nothing to put beside the body, and a 360px
            empty gutter is worse than full width. */}
        <div className="flex flex-col gap-5">
          {isEvent ? (
            <EventBody campaign={campaign} />
          ) : (
            <PromotionBody campaign={campaign} />
          )}

        </div>
      </div>

      {/* Who gets it. Which material is no longer asked — see `shareable`. */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        material={shareable}
        rows={rows}
        mode={isEvent ? "invite" : "share"}
        joinUrl={joinUrl}
        onConfirm={(clientIds) => {
          if (shareable) void share(shareable.id, clientIds);
        }}
      />

      <Toaster items={toasts} onRemove={removeToast} />
    </>
  );
}

type MetaItem = {
  icon: React.ReactNode;
  label: string;
  /** Shown in parentheses after the label — e.g. the ending-soon countdown. */
  labelHint?: string;
  value: string;
  /** Paints the value red — a fact the IC must not miss, like a full room. */
  critical?: boolean;
};

/**
 * One bordered frame, three layouts. Vertical rules are separate elements that
 * stretch with the row — cell borders were stopping short and read as a second
 * bottom edge.
 */
function MetaStrip({
  items,
  attached = false,
}: {
  items: MetaItem[];
  /** Sits flush under the banner inside a shared rounded frame. */
  attached?: boolean;
}) {
  const frame = attached
    ? "border-t border-border/50 bg-white"
    : "rounded-2xl border border-border/50 bg-white";

  return (
    <>
      <div className={`flex flex-col ${frame} sm:hidden`}>
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && <div aria-hidden className="h-px bg-border/50" />}
            <MetaCell {...item} />
          </Fragment>
        ))}
      </div>

      <div className={`hidden sm:grid sm:grid-cols-2 ${frame} xl:hidden`}>
        {items.map((item) => (
          <MetaCell key={item.label} {...item} />
        ))}
      </div>

      <div className={`hidden xl:flex xl:items-stretch ${frame}`}>
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && (
              <div aria-hidden className="w-px shrink-0 self-stretch bg-border/50" />
            )}
            <MetaCell {...item} className="min-w-0 flex-1" />
          </Fragment>
        ))}
      </div>
    </>
  );
}

function statusLine(
  status: ReturnType<typeof campaignStatus>,
  endDate: string | null,
  today: Date,
): string {
  // No closing date: the status *is* the whole answer, and a countdown would
  // have to invent the day it counts to. See `Campaign.startDate`.
  if (endDate === null) return "กำลังดำเนินการ";
  if (status === "ended") return `หมดเขตเมื่อ ${thaiDay(endDate)}`;
  if (status === "upcoming") return "ยังไม่เริ่ม";
  const left = Math.max(0, daysUntil(endDate, today));
  return left === 0 ? "วันสุดท้ายวันนี้" : `เหลืออีก ${left} วัน`;
}

function MetaCell({
  icon,
  label,
  labelHint,
  value,
  critical = false,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  labelHint?: string;
  value: string;
  critical?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 p-4 sm:p-5 ${className}`}>
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--fill-p1-100)] to-white text-[var(--fill-p1-600)] ring-1 ring-[var(--fill-p1-200,rgba(10,110,231,0.12))]"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-meta font-semibold tracking-wider text-muted-foreground">
          <span className="uppercase">{label}</span>
          {labelHint ? (
            <span className="normal-case font-medium text-destructive">
              {" "}
              ({labelHint})
            </span>
          ) : null}
        </p>
        <p
          className={`text-body-sm font-semibold leading-snug ${
            critical ? "text-destructive" : "text-foreground"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

