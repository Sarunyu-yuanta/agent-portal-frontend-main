"use client";

import { CheckIcon, LinkSimpleIcon, MapPinIcon, VideoCameraIcon } from "@phosphor-icons/react";
import { Tag } from "@sarunyu/system-one";
import type { Campaign } from "@/types/domain";
import { campaignDay } from "../campaign-data";
import { DetailSectionGroup, DetailSubsection } from "./DetailSection";
import { Disclaimer } from "./PromotionBody";
import { useT } from "@/i18n/I18nProvider";
import { useLocale } from "@/i18n/I18nProvider";

/**
 * What happens on the day, who is speaking, and where.
 *
 * The agenda leads rather than the description: an IC deciding whether to put a
 * client's evening on the line is asking "what will they actually get", and the
 * session titles answer that better than a paragraph does. Everything a
 * promotion also has — conditions, terms, disclaimer — keeps its shape and its
 * order from `PromotionBody`, so the two detail pages read as one surface.
 */
export function EventBody({ campaign }: { campaign: Campaign }) {
  const locale = useLocale();
  const t = useT();
  const online = campaign.format === "online";

  return (
    <DetailSectionGroup>
      <DetailSubsection title={t.campaigns.body.aboutEvent}>
        {/* The long form, not `summary` — that one-liner is already in the
            banner directly above this section. */}
        <div className="flex flex-col gap-3">
          {campaign.description.map((paragraph) => (
            <p key={paragraph} className="text-body leading-relaxed text-foreground">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {campaign.products.map((product) => (
            <Tag key={product} text={t.promotions.product[product]} variant="blue" size="small" />
          ))}
          {campaign.segments.map((segment) => (
            <Tag key={segment} text={t.promotions.segment[segment]} variant="gray" size="small" />
          ))}
        </div>
      </DetailSubsection>

      {campaign.agenda && campaign.agenda.length > 0 && (
        <DetailSubsection title={t.campaigns.body.agenda}>
          <div className="flex flex-col">
            {campaign.agenda.map((item, index) => (
              <div key={`${item.time}-${item.title}`} className="flex gap-3 sm:gap-4">
                <div className="flex w-[82px] shrink-0 flex-col items-end pt-0.5 sm:w-[104px]">
                  <span className="text-accent-orange text-label font-semibold tabular-nums">
                    {item.time}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="bg-primary-action mt-1.5 size-2 shrink-0 rounded-full" />
                  {index < (campaign.agenda?.length ?? 0) - 1 && (
                    <span className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-5">
                  <p className="text-body-sm leading-snug font-semibold text-foreground">
                    {item.title}
                  </p>
                  {item.speaker && (
                    <p className="text-label text-muted-foreground">
                      {t.campaigns.body.by(item.speaker)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DetailSubsection>
      )}

      {campaign.speakers && campaign.speakers.length > 0 && (
        <DetailSubsection title={t.campaigns.body.speakers}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campaign.speakers.map((speaker) => (
              <div key={speaker.name} className="flex items-center gap-3">
                {speaker.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- fixed-size headshot, no responsive sizes needed
                  <img
                    src={speaker.photo}
                    alt={speaker.name}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--fill-p1-100)] text-body-lg font-bold text-[var(--fill-p1-600)]"
                  >
                    {speaker.name.replace(/^(ดร\.|คุณ|นาย|นาง|นางสาว)\s*/, "").charAt(0)}
                  </span>
                )}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-body-sm leading-snug font-bold text-foreground">
                    {speaker.name}
                  </p>
                  <p className="text-label leading-snug text-muted-foreground">{speaker.title}</p>
                </div>
              </div>
            ))}
          </div>
        </DetailSubsection>
      )}

      <DetailSubsection title={t.campaigns.body.venueAndAttendance}>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--fill-p1-100)] to-white text-[var(--fill-p1-600)] ring-1 ring-[var(--fill-p1-200,rgba(10,110,231,0.12))]"
            >
              {online ? (
                <VideoCameraIcon size={17} weight="fill" />
              ) : (
                <MapPinIcon size={17} weight="fill" />
              )}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-body-sm font-semibold text-foreground">{campaign.venue ?? "—"}</p>
              <p className="text-label text-muted-foreground">
                {campaign.eventDate ? campaignDay(campaign.eventDate, locale) : "—"}
                {campaign.seatsTotal ? t.campaigns.body.totalSeats(campaign.seatsTotal) : ""}
              </p>
            </div>
          </div>

          {online && campaign.joinUrl && (
            <a
              href={campaign.joinUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary-action flex items-center gap-1.5 text-label font-medium break-all hover:underline"
            >
              <LinkSimpleIcon size={14} weight="bold" className="shrink-0" />
              {campaign.joinUrl}
            </a>
          )}
        </div>
      </DetailSubsection>

      <DetailSubsection title={t.campaigns.body.conditions}>
        <ul className="flex list-none flex-col gap-3 p-0">
          {campaign.conditions.map((condition) => (
            <li key={condition} className="flex items-start gap-3 text-body-sm leading-relaxed">
              {/* One line tall, so the badge centres on the first line of
                  text rather than sitting on its top edge. */}
              <span aria-hidden className="flex h-lh shrink-0 items-center">
                <span className="bg-primary-action-light text-primary-action flex size-6 items-center justify-center rounded-full">
                  <CheckIcon size={13} weight="bold" />
                </span>
              </span>
              <span className="text-foreground">{condition}</span>
            </li>
          ))}
        </ul>
      </DetailSubsection>

      <DetailSubsection title={t.campaigns.body.terms}>
        <ol className="flex list-none flex-col gap-3 p-0">
          {campaign.terms.map((term, index) => (
            <li key={term} className="flex items-start gap-3 text-body-sm leading-relaxed">
              <span className="flex h-lh shrink-0 items-center">
                <span className="bg-primary-action-light text-primary-action flex size-6 items-center justify-center rounded-full text-meta font-bold tabular-nums">
                  {index + 1}
                </span>
              </span>
              <span className="text-foreground">{term}</span>
            </li>
          ))}
        </ol>
      </DetailSubsection>

      <div className="not-first:mt-6 not-first:border-t not-first:border-border/50 not-first:pt-6">
        <Disclaimer text={campaign.disclaimer} />
      </div>
    </DetailSectionGroup>
  );
}
