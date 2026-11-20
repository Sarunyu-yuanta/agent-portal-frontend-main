"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LocaleLink as Link } from "@/i18n/navigation";
import {
  Bank,
  CaretLeftIcon,
  CaretRightIcon,
  Cpu,
  Cube,
  HeadCircuit,
  RocketLaunch,
} from "@phosphor-icons/react";
import { Button, PaginationBanner } from "@sarunyu/system-one";
import { MutualFundSeeMoreIcon, MutualFundThemeList } from "./MutualFundCard";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  getThemeDescription,
  getThemeHeroTitle,
  mutualFundThemeHref,
  type MutualFundTheme,
  type MutualFundThemeIcon,
  type MutualFundThemeId,
} from "./mutual-fund-data";
import { MutualFundSectionEmpty } from "./mutual-fund-ui";
import { useDragScroll } from "./use-drag-scroll";
import { useT } from "@/i18n/I18nProvider";

/** Figma theme icons resolve to Phosphor glyphs, not exported assets — the mock catalog's icon-*.svg files for bank/cpu/plant/health turned out to be misassigned/decorative filler, not real glyphs. */
export const THEME_ICON_COMPONENTS: Record<
  MutualFundThemeIcon,
  React.ComponentType<{
    size?: number;
    className?: string;
    weight?: "fill" | "regular" | "bold" | "duotone";
    style?: React.CSSProperties;
  }>
> = {
  "head-circuit": HeadCircuit,
  bank: Bank,
  cpu: Cpu,
  "rocket-launch": RocketLaunch,
  cube: Cube,
};

/** Figma 39839:525396's theme-detail hero uses the same light-blue wash and gradient bar for every theme — only the title and illustration change per tab. */
export const THEME_HERO_COLOR = {
  glow: "#eff6ff",
  title: "#074ea4",
  from: "#00a1e9",
  to: "#004eba",
};

/** Figma 40473:722554/721855/721622/722088/722322 — one hero illustration per theme, glow behind it shared across every theme. */
export function ThemeHeroGraphic({
  themeId,
  scale = 1,
}: {
  themeId: MutualFundThemeId;
  scale?: number;
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute z-0 rounded-full"
        style={{
          backgroundColor: THEME_HERO_COLOR.glow,
          bottom: -61 * scale,
          right: 21 * scale,
          width: 124 * scale,
          height: 124 * scale,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute z-10"
        style={{ bottom: 8 * scale, right: 24 * scale, width: 100 * scale, height: 100 * scale }}
        aria-hidden
      >
        {MF_ASSETS.themeHero[themeId] && (
          <Image
            src={MF_ASSETS.themeHero[themeId]}
            alt=""
            fill
            className="object-contain"
            sizes={`${100 * scale}px`}
          />
        )}
      </div>
    </>
  );
}

const THEME_PAGE_COUNT = 2;

function getThemeActiveIndex(el: HTMLElement) {
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= 1) return 0;
  return el.scrollLeft >= maxScroll / 2 ? 1 : 0;
}

function scrollThemeToPage(el: HTMLElement, pageIndex: number) {
  const maxScroll = el.scrollWidth - el.clientWidth;
  el.scrollTo({ left: pageIndex === 0 ? 0 : maxScroll, behavior: "smooth" });
}

function ThemeIcon({ icon }: { icon: MutualFundThemeIcon }) {
  // An icon key the app doesn't know draws nothing rather than crashing.
  const Icon = THEME_ICON_COMPONENTS[icon];
  if (!Icon) return null;
  return <Icon size={20} weight="fill" className="mt-0.5 size-5 shrink-0 text-white" />;
}

/** Figma 40118:77413 — theme card 308×380 (header row grew to fit the theme description under the title) */
function ThemeCard({
  theme,
  onFundSelect,
  onThemeSeeAll,
}: {
  theme: MutualFundTheme;
  onFundSelect?: (fundId: string) => void;
  onThemeSeeAll?: (themeId: MutualFundTheme["id"]) => void;
}) {
  const t = useT();
  return (
    <div className="flex min-h-[380px] w-[308px] shrink-0 flex-col gap-[10px] rounded-lg bg-gradient-to-b from-[#0a6ee7] to-[#f3f4f6] to-[85.462%] px-1 pt-2 pb-1">
      <div className="flex w-full items-start gap-1 px-3">
        <ThemeIcon icon={theme.icon} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base leading-[28px] font-bold text-white">
            {getThemeHeroTitle(theme.id)}
          </span>
          <span className="truncate text-xs leading-[20px] font-normal text-white">
            {getThemeDescription(theme.id)}
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-0.5">
        {theme.funds.length === 0 ? (
          // Same white box the fund list sits in, so the card keeps its shape; no "see more" into an empty theme.
          <div className="w-full shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white">
            <MutualFundSectionEmpty title={t.fund.empty.themeFunds} />
          </div>
        ) : (
          <>
            <MutualFundThemeList funds={theme.funds} onFundSelect={onFundSelect} />
            <div className="flex h-10 w-full items-center justify-center">
              <Link
                href={mutualFundThemeHref(theme.id)}
                className="inline-flex w-fit shrink-0 no-underline"
                onClick={
                  onThemeSeeAll
                    ? (e) => {
                        e.preventDefault();
                        onThemeSeeAll(theme.id);
                      }
                    : undefined
                }
              >
                <Button
                  variant="plain"
                  size="xl"
                  rightIcon={<MutualFundSeeMoreIcon />}
                  className="w-fit shrink-0"
                >
                  {t.fund.list.seeMore}
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Figma 40118:77403 — full-width themes band */
export function MutualFundThemesSection({
  themes,
  onFundSelect,
  onThemeSeeAll,
}: {
  themes: MutualFundTheme[];
  onFundSelect?: (fundId: string) => void;
  onThemeSeeAll?: (themeId: MutualFundTheme["id"]) => void;
}) {
  const t = useT();
  const { ref: scrollRef, ...dragHandlers } = useDragScroll();
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
      setActiveIndex(getThemeActiveIndex(el));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [scrollRef, themes.length]);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    scrollThemeToPage(el, dir === -1 ? 0 : 1);
  };

  return (
    <section className="flex w-full flex-col gap-4 pt-3 pb-10">
      <div>
        <div className="flex items-center gap-1">
          <Image src={MF_ASSETS.medal} alt="" width={24} height={24} className="size-6 shrink-0" />
          <h2 className="text-lg leading-[32px] font-bold text-[#101828]">
            {t.fund.themes.sectionTitle}
          </h2>
        </div>
        <p className="text-sm leading-[24px] text-[#101828]">{t.fund.themes.sectionSubtitle}</p>
      </div>

      {themes.length === 0 ? (
        <MutualFundSectionEmpty title={t.fund.empty.themes} />
      ) : (
        <>
          <div className="relative w-full px-0 lg:px-12">
            {canScrollLeft && (
              <Button
                variant="outline"
                size="icon-md"
                aria-label={t.fund.list.scrollLeft}
                className="absolute top-1/2 left-0 z-10 hidden -translate-y-1/2 lg:flex"
                onClick={() => scrollBy(-1)}
              >
                <CaretLeftIcon size={20} />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="outline"
                size="icon-md"
                aria-label={t.fund.list.scrollRight}
                className="absolute top-1/2 right-0 z-10 hidden -translate-y-1/2 lg:flex"
                onClick={() => scrollBy(1)}
              >
                <CaretRightIcon size={20} />
              </Button>
            )}

            <div
              ref={scrollRef}
              className="hide-scrollbar overflow-x-auto"
              style={{ scrollbarWidth: "none", cursor: "grab" }}
              {...dragHandlers}
            >
              <div className="flex min-w-max gap-2.5">
                {themes.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    onFundSelect={onFundSelect}
                    onThemeSeeAll={onThemeSeeAll}
                  />
                ))}
              </div>
            </div>
          </div>

          <PaginationBanner
            count={THEME_PAGE_COUNT}
            activeIndex={activeIndex}
            className="w-full justify-center"
            onIndexChange={(index) => {
              const el = scrollRef.current;
              if (el) scrollThemeToPage(el, index);
            }}
          />
        </>
      )}
    </section>
  );
}
