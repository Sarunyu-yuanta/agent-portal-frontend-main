"use client";

import { useMemo, useState } from "react";
import { Avatar, Button, SearchInput } from "@sarunyu/system-one";
import { CheckCircleIcon, CircleIcon, MagnifyingGlassIcon, UsersIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveBottomSheetModal } from "@/components/ui/responsive-bottom-sheet-modal";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { useClients } from "@/hooks/use-api";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type { Client } from "@/types/domain";
import {
  advisoryAccountStatus,
  riskProfileLabel,
  type AdvisoryService,
} from "@/features/catalog/robo-advisory/lib/portfolio-advisory-client";
import { AdvisoryAccountTag } from "./portfolio-advisory-ui";
import { useT } from "@/i18n/I18nProvider";

const SERVICE_TITLE: Record<AdvisoryService, string> = {
  robo: "Robo Advisory",
  definit: "Definit x Yuanta",
};

type AccountFilter = "all" | "open" | "none";

/** Labelled by `t.products.advisory.picker.accountFilter`. */
const ACCOUNT_FILTERS: AccountFilter[] = ["all", "open", "none"];

function AccountFilterSegments({
  value,
  counts,
  onChange,
}: {
  value: AccountFilter;
  counts: Record<AccountFilter, number>;
  onChange: (next: AccountFilter) => void;
}) {
  const t = useT();
  return (
    <div role="tablist" className="flex w-full shrink-0 gap-1 rounded-lg bg-[#f3f4f6] p-1">
      {ACCOUNT_FILTERS.map((id) => {
        const label = t.products.advisory.picker.accountFilter[id];
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`min-w-0 flex-1 cursor-pointer truncate rounded-md px-2 py-1.5 text-xs leading-[20px] font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:outline-none ${
              active
                ? "bg-white text-[#0a6ee7] shadow-sm"
                : "text-[#4a5565] hover:bg-white/60 hover:text-[#101828]"
            }`}
          >
            {t.products.advisory.picker.segment(label, counts[id])}
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
  const t = useT();
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
      } focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:outline-none`}
    >
      <Avatar type="text" initials={getInitial(displayName)} size="m" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm leading-[24px] font-bold text-[#101828]">{displayName}</p>
        <p className="truncate text-xs leading-[20px] text-[#4a5565]">
          {client.tier} · {riskProfileLabel(client, t)}
        </p>
      </div>
      <AdvisoryAccountTag status={advisoryAccountStatus(client, service)} />
      {selected ? (
        <CheckCircleIcon size={20} weight="fill" className="shrink-0 text-[#0a6ee7]" />
      ) : (
        <CircleIcon
          size={20}
          className="shrink-0 text-black/20 transition-colors group-hover:text-black/40"
        />
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
  const t = useT();
  return (
    <ResponsiveBottomSheetModal
      open={open}
      onClose={onClose}
      title={t.products.advisory.picker.title}
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
  const t = useT();
  const labels = t.products.advisory.picker;
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
        maskName(client.name, isPrivate).toLowerCase().includes(query) || client.id.includes(query),
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
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-3 pb-4">
      <p className="shrink-0 text-sm leading-[24px] text-[#4a5565]">
        {labels.intro(SERVICE_TITLE[service])}
      </p>

      <SearchInput
        value={search}
        onChange={setSearch}
        onClear={() => setSearch("")}
        placeholder={labels.searchPlaceholder}
        size="sm"
        className="w-full shrink-0"
      />

      <AccountFilterSegments value={accountFilter} counts={counts} onChange={setAccountFilter} />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto max-lg:max-h-[calc(var(--dvh)*50)] lg:max-h-[calc(var(--vh)*45)]">
        {clients.length === 0 ? (
          // Nobody to pick at all — not something a search or segment did.
          <EmptyState
            size="compact"
            icon={<UsersIcon size={40} className="text-[var(--text-default-placeholder)]" />}
            title={labels.noClients}
          />
        ) : results.length === 0 ? (
          <EmptyState
            size="compact"
            icon={
              <MagnifyingGlassIcon size={40} className="text-[var(--text-default-placeholder)]" />
            }
            title={search.trim() ? t.states.noResultTitle : t.states.noFilterResultTitle}
            body={search.trim() ? t.states.noResultBody : t.states.noFilterResultBody}
            action={{
              label: t.states.clearFilters,
              onClick: () => {
                setSearch("");
                setAccountFilter("all");
              },
            }}
          />
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
        {labels.viewPlans}
      </Button>
    </div>
  );
}
