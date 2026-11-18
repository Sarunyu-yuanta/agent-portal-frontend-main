"use client";

import {
  CheckIcon,
  LinkSimpleIcon,
  MapPinIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react";
import { Tag } from "@sarunyu/system-one";
import type { Campaign } from "@/types/domain";
import { PRODUCT_LABEL, SEGMENT_LABEL, thaiDay } from "../campaign-data";
import { DetailSectionGroup, DetailSubsection } from "./DetailSection";
import { Disclaimer } from "./PromotionBody";

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
  const online = campaign.format === "online";

  return (
    <DetailSectionGroup>
      <DetailSubsection title="เกี่ยวกับงานนี้">
        {/* The long form, not `summary` — that one-liner is already in the
            banner directly above this section. */}
        <div className="flex flex-col gap-3">
          {campaign.description.map((paragraph) => (
            <p
              key={paragraph}
              className="text-body leading-relaxed text-foreground"
            >
              {paragraph}
            </p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {campaign.products.map((product) => (
            <Tag key={product} text={PRODUCT_LABEL[product]} variant="blue" size="small" />
          ))}
          {campaign.segments.map((segment) => (
            <Tag key={segment} text={SEGMENT_LABEL[segment]} variant="gray" size="small" />
          ))}
        </div>
      </DetailSubsection>

      {campaign.agenda && campaign.agenda.length > 0 && (
        <DetailSubsection title="กำหนดการ">
          <div className="flex flex-col">
            {campaign.agenda.map((item, index) => (
              <div
                key={`${item.time}-${item.title}`}
                className="flex gap-3 sm:gap-4"
              >
                <div className="flex w-[82px] shrink-0 flex-col items-end pt-0.5 sm:w-[104px]">
                  <span className="text-label font-semibold tabular-nums text-accent-orange">
                    {item.time}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary-action" />
                  {index < (campaign.agenda?.length ?? 0) - 1 && (
                    <span className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-5">
                  <p className="text-body-sm font-semibold leading-snug text-foreground">
                    {item.title}
                  </p>
                  {item.speaker && (
                    <p className="text-label text-muted-foreground">
                      โดย {item.speaker}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DetailSubsection>
      )}

      {campaign.speakers && campaign.speakers.length > 0 && (
        <DetailSubsection title="วิทยากร">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campaign.speakers.map((speaker) => (
              <div
                key={speaker.name}
                className="flex items-center gap-3"
              >
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
                  <p className="text-body-sm font-bold leading-snug text-foreground">
                    {speaker.name}
                  </p>
                  <p className="text-label leading-snug text-muted-foreground">
                    {speaker.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DetailSubsection>
      )}

      <DetailSubsection title="สถานที่และการเข้าร่วม">
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
              <p className="text-body-sm font-semibold text-foreground">
                {campaign.venue ?? "—"}
              </p>
              <p className="text-label text-muted-foreground">
                {campaign.eventDate ? thaiDay(campaign.eventDate) : "—"}
                {campaign.seatsTotal
                  ? ` · ที่นั่งทั้งหมด ${campaign.seatsTotal} ที่นั่ง`
                  : ""}
              </p>
            </div>
          </div>

          {online && campaign.joinUrl && (
            <a
              href={campaign.joinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 break-all text-label font-medium text-primary-action hover:underline"
            >
              <LinkSimpleIcon size={14} weight="bold" className="shrink-0" />
              {campaign.joinUrl}
            </a>
          )}
        </div>
      </DetailSubsection>

      <DetailSubsection title="เงื่อนไขการเข้าร่วม">
        <ul className="flex list-none flex-col gap-3 p-0">
          {campaign.conditions.map((condition) => (
            <li
              key={condition}
              className="flex items-start gap-3 text-body-sm leading-relaxed"
            >
              {/* One line tall, so the badge centres on the first line of
                  text rather than sitting on its top edge. */}
              <span aria-hidden className="flex h-lh shrink-0 items-center">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary-action-light text-primary-action">
                  <CheckIcon size={13} weight="bold" />
                </span>
              </span>
              <span className="text-foreground">
                {condition}
              </span>
            </li>
          ))}
        </ul>
      </DetailSubsection>

      <DetailSubsection title="ข้อกำหนดและเงื่อนไข">
        <ol className="flex list-none flex-col gap-3 p-0">
          {campaign.terms.map((term, index) => (
            <li
              key={term}
              className="flex items-start gap-3 text-body-sm leading-relaxed"
            >
              <span className="flex h-lh shrink-0 items-center">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary-action-light text-meta font-bold tabular-nums text-primary-action">
                  {index + 1}
                </span>
              </span>
              <span className="text-foreground">
                {term}
              </span>
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
