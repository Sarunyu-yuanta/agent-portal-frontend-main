"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Avatar } from "@sarunyu/system-one";
import { CaretRightIcon } from "@phosphor-icons/react";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { formatAumThb, getInitials } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type { Client } from "@/types/domain";

export function ClientListModal({
  open,
  clients,
  onClose,
}: {
  open: boolean;
  clients: Client[];
  onClose: () => void;
}) {
  const { isPrivate } = usePrivacy();

  const sorted = useMemo(
    () => [...clients].sort((a, b) => b.aum - a.aum),
    [clients],
  );

  return (
    <ResponsiveBottomSheetModal
      open={open}
      onClose={onClose}
      title="รายชื่อ Client"
      titleId="dashboard-client-list"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-body-sm text-muted-foreground">
            ไม่มีลูกค้าในระบบ
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-[var(--bg-default-secondary)] divide-y divide-black/[0.05]">
            {sorted.map((client) => {
              const name = maskName(client.name, isPrivate);
              return (
                <Link
                  key={client.id}
                  href={`/client/${client.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 no-underline transition-colors hover:bg-[var(--fill-p1-100)]"
                >
                  <Avatar type="text" initials={getInitials(name)} size="m" />
                  <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                    <p className="truncate text-body font-bold text-foreground">
                      {name}
                    </p>
                    <p className="truncate text-meta text-muted-foreground">
                      {client.tier}
                    </p>
                  </div>
                  <span className="shrink-0 text-label font-bold tabular-nums text-foreground">
                    {formatAumThb(client.aum)}
                  </span>
                  <CaretRightIcon
                    size={16}
                    className="shrink-0 text-[var(--text-default-placeholder)]"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </ResponsiveBottomSheetModal>
  );
}
