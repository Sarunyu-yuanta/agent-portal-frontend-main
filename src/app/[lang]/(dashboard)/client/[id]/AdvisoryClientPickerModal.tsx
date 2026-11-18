"use client";

import { useMemo, useState } from "react";
import { Avatar, Button, SearchInput } from "@sarunyu/system-one";
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { useClients } from "@/hooks/use-api";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type { Client } from "@/types/domain";
import { advisoryAccountStatus, riskProfileLabel, type AdvisoryService } from "./portfolio-advisory-client";
import { AdvisoryAccountTag } from "./portfolio-advisory-ui";

const SERVICE_TITLE: Record<AdvisoryService, string> = {
  robo: "Robo Advisory",
  definit: "Definit x Yuanta",
};

type AccountFilter = "all" | "open" | "none";

const ACCOUNT_FILTERS: { id: AccountFilter; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "open", label: "เปิดบัญชีแล้ว" },
  { id: "none", label: "ยังไม่เปิดบัญชี" },
];

function AccountFilterSegments({
  value,
  counts,
  onChange,
}: {
  value: AccountFilter;
  counts: Record<AccountFilter, number>;
  onChange: (next: AccountFilter) => void;
}) {
  return (
    <div role="tablist" className="flex w-full shrink-0 gap-1 rounded-lg bg-[#f3f4f6] p-1">
      {ACCOUNT_FILTERS.map(({ id, label }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`min-w-0 flex-1 cursor-pointer truncate rounded-md px-2 py-1.5 text-xs font-bold leading-[20px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7] ${
              active
                ? "bg-white text-[#0a6ee7] shadow-sm"
                : "text-[#4a5565] hover:bg-white/60 hover:text-[#101828]"
            }`}
          >
            {label} ({counts[id]})
          </button>
        );
      })}
    </div>
  );
}

function ClientRow({
  client,
  service,
  selected,
  onSelect,
}: {
  client: Client;
  service: AdvisoryService;
  selected: boolean;
  onSelect: () => void;
}) {
  const { isPrivate } = usePrivacy();
  const displayName = maskName(client.name, isPrivate);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected
          ? "border-[#0a6ee7] bg-[#eff6ff]"
          : "border-black/10 bg-white hover:border-black/20 hover:bg-[#f9fafb]"
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7]`}
    >
      <Avatar type="text" initials={getInitial(displayName)} size="m" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-bold leading-[24px] text-[#101828]">{displayName}</p>
        <p className="truncate text-xs leading-[20px] text-[#4a5565]">
          {client.tier} · {riskProfileLabel(client)}
        </p>
      </div>
      <AdvisoryAccountTag status={advisoryAccountStatus(client, service)} />
      {selected ? (
        <CheckCircleIcon size={20} weight="fill" className="shrink-0 text-[#0a6ee7]" />
      ) : (
        <CircleIcon size={20} className="shrink-0 text-black/20 transition-colors group-hover:text-black/40" />
      )}
    </button>
  );
}

/**
 * Gate in front of every Portfolio Advisory plan list: an IC reads plans *for a
 * client*, so the service can't be opened until one is picked.
 */
export function AdvisoryClientPickerModal({
  open,
  service,
  selectedClientId,
  onClose,
  onConfirm,
}: {
  open: boolean;
  service: AdvisoryService;
  selectedClientId?: string;
  onClose: () => void;
  onConfirm: (clientId: string) => void;
}) {
  return (
    <ResponsiveBottomSheetModal
      open={open}
      onClose={onClose}
      title="เลือกลูกค้า"
      titleId="advisory-client-picker-title"
    >
      {/* Remounting on each open is what resets the draft selection and search. */}
      <PickerBody
        key={open ? "open" : "closed"}
        service={service}
        selectedClientId={selectedClientId}
        onConfirm={onConfirm}
      />
    </ResponsiveBottomSheetModal>
  );
}

function PickerBody({
  service,
  selectedClientId,
  onConfirm,
}: {
  service: AdvisoryService;
  selectedClientId?: string;
  onConfirm: (clientId: string) => void;
}) {
  const clients = useClients();
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");
  const [draftId, setDraftId] = useState<string | undefined>(selectedClientId);
  const { isPrivate } = usePrivacy();

  // The search narrows what the segments count, so the numbers always describe
  // the list the IC is actually looking at.
  const searched = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter(
      (client) =>
        maskName(client.name, isPrivate).toLowerCase().includes(query) ||
        client.id.includes(query),
    );
  }, [clients, search, isPrivate]);

  const counts = useMemo(() => {
    const open = searched.filter((c) => advisoryAccountStatus(c, service) === "open").length;
    return { all: searched.length, open, none: searched.length - open };
  }, [searched, service]);

  const results =
    accountFilter === "all"
      ? searched
      : searched.filter((c) => advisoryAccountStatus(c, service) === accountFilter);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-3">
      <p className="shrink-0 text-sm leading-[24px] text-[#4a5565]">
        เลือกลูกค้าเพื่อดูแผน {SERVICE_TITLE[service]} ที่เหมาะกับระดับความเสี่ยงของเขา
      </p>

      <SearchInput
        value={search}
        onChange={setSearch}
        onClear={() => setSearch("")}
        placeholder="ค้นหาชื่อหรือรหัสลูกค้า"
        size="sm"
        className="w-full shrink-0"
      />

      <AccountFilterSegments value={accountFilter} counts={counts} onChange={setAccountFilter} />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto max-lg:max-h-[calc(var(--dvh)*50)] lg:max-h-[calc(var(--vh)*45)]">
        {results.length === 0 ? (
          <p className="py-8 text-center text-sm leading-[24px] text-[#4a5565]">ไม่พบลูกค้าที่ค้นหา</p>
        ) : (
          results.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              service={service}
              selected={draftId === client.id}
              onSelect={() => setDraftId(client.id)}
            />
          ))
        )}
      </div>

      <Button
        variant={draftId ? "primary" : "disabled"}
        size="lg"
        disabled={!draftId}
        onClick={() => draftId && onConfirm(draftId)}
        className="w-full shrink-0"
      >
        ดูแผนการลงทุน
      </Button>
    </div>
  );
}
