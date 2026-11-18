"use client";

import { useCallback, useMemo } from "react";
import { Button, Card } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useNBAActions } from "@/hooks/use-api";
import { usePrivacy } from "@/contexts/privacy-context";
import { useSectionBack } from "@/hooks/use-section-back";
import { useScrollTopOnChange } from "@/hooks/use-scroll-top";
import { useStoredIds } from "@/hooks/use-stored-ids";
import { CardCount } from "../CardHeader";
import { NbaPanel } from "../NbaPanel";
import { buildNbaRows, isNbaId, HIDDEN_NBA_IDS_PREF } from "../dashboard-data";

/**
 * Every open suggestion, not the Dashboard card's shortlist.
 *
 * Drawn with the same rows the card uses rather than the table the Call Log
 * sub-page gets: an NBA row carries two lines of reasoning and a drafted
 * message, and a table cell is the wrong shape for a paragraph you are meant to
 * read before acting on it. What the page adds is room — every suggestion at
 * once, with nothing cut off the bottom.
 */
export default function NextBestActionsPage() {
  const nbaActions = useNBAActions();
  const { isPrivate } = usePrivacy();
  // Falls back to the Dashboard on a cold entry — a pasted link, or a session
  // restored straight onto this page, where there is no trail to walk up.
  const goBack = useSectionBack(() => "/command-center");

  // Opened from a Dashboard that was scrolled down; `<main>` owns the scroll, so
  // nothing resets it on its own.
  useScrollTopOnChange([]);

  // The same preference the card writes, so dismissing here and dismissing
  // there are one act rather than two lists that disagree.
  const [dismissed, setDismissed] = useStoredIds<string>(HIDDEN_NBA_IDS_PREF, isNbaId);

  const rows = useMemo(
    () => buildNbaRows(nbaActions, isPrivate).filter((row) => !dismissed.has(row.action.id)),
    [nbaActions, isPrivate, dismissed],
  );

  const handleDismiss = useCallback(
    (id: string) => setDismissed(new Set([...dismissed, id])),
    [dismissed, setDismissed],
  );

  return (
    /* `xl:pb-20` clears the floating "New note" button the shell pins at
       `bottom-8 right-8` from `xl` up — see the Call Log page for the same. */
    <div className="flex flex-col gap-4 xl:gap-5 xl:pb-20">
      <div className="flex items-center gap-2">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={goBack}
          aria-label="กลับไปหน้า Dashboard"
          className="shrink-0"
        >
          <ArrowLeftIcon size={18} />
        </Button>
        <h1 className="type-h6 text-foreground">Next Best Actions</h1>
        {rows.length > 0 && <CardCount value={rows.length} />}
      </div>

      <Card variant="default" className="gap-4">
        {/* No limit: the shortlist is the card's job, and this page exists
            because that shortlist ran out. */}
        <NbaPanel rows={rows} limit={rows.length} onDismiss={handleDismiss} />
      </Card>
    </div>
  );
}
