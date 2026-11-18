"use client";

import { Avatar } from "@sarunyu/system-one";
import { UsersIcon, CaretRightIcon } from "@phosphor-icons/react";
import { getInitials, formatAumThb } from "@/lib/client-utils";
import { useSlideOver, SlideOverPanel } from "@/components/ui/slide-over";
import { ClientDetailPanel } from "./ClientDetailPanel";
import { NINE_BOX_HEAT_STYLES, type NineBoxCellInfo } from "./NineBoxTab";
import type { Client } from "@/types/domain";

/** Content of the nine-box cell drawer: segment header, client list, and a
 * pushed client detail overlay. */
export function NineBoxCellDrawer({
  cell,
  onViewFullProfile,
}: {
  cell: NineBoxCellInfo;
  onViewFullProfile: (clientId: string) => void;
}) {
  const push = useSlideOver<Client>();
  const style = NINE_BOX_HEAT_STYLES[cell.heat];

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-default)] shrink-0">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full shrink-0 ${style.dot}`} />
          <p className="type-subtitle-1 font-bold text-foreground">{cell.label}</p>
        </div>
        <p className="type-caption text-muted-foreground mt-1 pl-[18px]">
          {cell.aumLabel} AUM · {cell.aiLabel} AI Score
        </p>
      </div>

      {/* Client list */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {cell.clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="size-12 rounded-full bg-[var(--bg-default-secondary)] flex items-center justify-center">
              <UsersIcon size={24} className="text-muted-foreground" weight="duotone" />
            </div>
            <p className="type-body-2 text-muted-foreground">No clients in this segment</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-4">
            <p className="type-caption text-muted-foreground px-1">
              {cell.clients.length} client{cell.clients.length !== 1 ? "s" : ""}
            </p>
            {cell.clients.map((c) => (
              <button
                key={c.id}
                type="button"
                className="bg-white border border-[rgba(0,0,0,0.1)] rounded-lg p-3 flex items-center gap-3 w-full text-left hover:bg-[var(--bg-default-secondary)] transition-colors cursor-pointer"
                onClick={() => push.open(c)}
              >
                <Avatar type="text" initials={getInitials(c.name)} size="s" />
                <div className="flex-1 min-w-0">
                  <p className="type-subtitle-2 font-semibold text-foreground truncate">{c.name}</p>
                  <p className="type-caption text-muted-foreground">{c.tier} · {c.id}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="type-caption font-semibold text-foreground">{formatAumThb(c.aum)}</p>
                  <p className="type-caption text-muted-foreground">AI {c.aiScore}</p>
                </div>
                <CaretRightIcon size={20} className="text-[var(--text-default-tertiary)] shrink-0" />
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
