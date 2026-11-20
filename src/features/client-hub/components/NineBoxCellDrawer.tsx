"use client";

import { Avatar } from "@sarunyu/system-one";
import { UsersIcon, CaretRightIcon } from "@phosphor-icons/react";
import { getInitials, formatAumThb } from "@/lib/client-utils";
import { useSlideOver, SlideOverPanel } from "@/components/ui/slide-over";
import { ClientDetailPanel } from "./ClientDetailPanel";
import { NINE_BOX_HEAT_STYLES, type NineBoxCellInfo } from "./NineBoxTab";
import type { Client } from "@/types/domain";
import { useT } from "@/i18n/I18nProvider";

/** Content of the nine-box cell drawer: segment header, client list, and a
 * pushed client detail overlay. */
export function NineBoxCellDrawer({
  cell,
  onViewFullProfile,
}: {
  cell: NineBoxCellInfo;
  onViewFullProfile: (clientId: string) => void;
}) {
  const t = useT();
  const nb = t.client.nineBox;
  const push = useSlideOver<Client>();
  const style = NINE_BOX_HEAT_STYLES[cell.heat];

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--border-default)] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 shrink-0 rounded-full ${style.dot}`} />
          <p className="type-subtitle-1 font-bold text-foreground">{nb.cells[cell.id]}</p>
        </div>
        <p className="type-caption mt-1 pl-[18px] text-muted-foreground">
          {nb.cellSubtitle(nb.tiers[cell.aumTier], nb.tiers[cell.aiTier])}
        </p>
      </div>

      {/* Client list */}
      <div className="hide-scrollbar flex-1 overflow-y-auto">
        {cell.clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex size-12 items-center justify-center rounded-full bg-[var(--bg-default-secondary)]">
              <UsersIcon size={24} className="text-muted-foreground" weight="duotone" />
            </div>
            <p className="type-body-2 text-muted-foreground">{nb.noClients}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-4">
            <p className="type-caption px-1 text-muted-foreground">
              {nb.clientCount(cell.clients.length)}
            </p>
            {cell.clients.map((c) => (
              <button
                key={c.id}
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white p-3 text-left transition-colors hover:bg-[var(--bg-default-secondary)]"
                onClick={() => push.open(c)}
              >
                <Avatar type="text" initials={getInitials(c.name)} size="s" />
                <div className="min-w-0 flex-1">
                  <p className="type-subtitle-2 truncate font-semibold text-foreground">{c.name}</p>
                  <p className="type-caption text-muted-foreground">
                    {c.tier} · {c.id}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="type-caption font-semibold text-foreground">
                    {formatAumThb(c.aum)}
                  </p>
                  <p className="type-caption text-muted-foreground">AI {c.aiScore}</p>
                </div>
                <CaretRightIcon
                  size={20}
                  className="shrink-0 text-[var(--text-default-tertiary)]"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Push overlay: client detail */}
      {push.mounted && push.data && (
        <SlideOverPanel visible={push.visible}>
          <ClientDetailPanel
            client={push.data}
            onViewFull={() => onViewFullProfile(push.data!.id)}
            onBack={push.close}
          />
        </SlideOverPanel>
      )}
    </div>
  );
}
