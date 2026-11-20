"use client";

import { useState } from "react";
import { Card, Tag, Button, Modal, Input, Dropdown, DropdownMultiple } from "@sarunyu/system-one";
import { PlusIcon } from "@phosphor-icons/react";
import { usePipelineDeals } from "@/hooks/use-api";
import { ErrorState } from "@/components/ui/empty-state";
import { StageAdvanceModal } from "./StageAdvanceModal";
import { KanbanColumn } from "./KanbanColumn";
import type { Deal, Stage } from "./pipeline-data";
import { useT } from "@/i18n/I18nProvider";

export default function PipelinePage() {
  const {
    data: strapiDeals,
    isLoading: dealsLoading,
    error: dealsError,
    retry: retryDeals,
  } = usePipelineDeals();
  const t = useT();
  const p = t.pipeline;
  const [showModal, setShowModal] = useState(false);
  const [newProposal, setNewProposal] = useState({ clientName: "", productType: "", dealSize: "" });
  const [deals, setDeals] = useState<Deal[]>(() => strapiDeals.map((d) => ({ ...d })));
  const [dealsSource, setDealsSource] = useState(strapiDeals);
  if (dealsSource !== strapiDeals) {
    setDealsSource(strapiDeals);
    setDeals(strapiDeals.map((d) => ({ ...d })));
  }
  const [advancing, setAdvancing] = useState<{ deal: Deal; next: Stage } | null>(null);

  const activeStages: Stage[] = ["Qualified", "Proposed", "Under Review", "Negotiation"];
  const closedStages: Stage[] = ["Closed Won", "Closed Lost"];
  const allStages = [...activeStages, ...closedStages];

  function handleAdvanceRequest(dealId: string, next: Stage) {
    const deal = deals.find((d) => d.id === dealId);
    if (deal) setAdvancing({ deal, next });
  }

  function handleAdvanceConfirm() {
    if (!advancing) return;
    setDeals((prev) =>
      prev.map((d) => (d.id === advancing.deal.id ? { ...d, stage: advancing.next } : d)),
    );
    setAdvancing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4">
        {[
          {
            label: p.kpi.totalValue,
            tag: p.kpi.vsQuarter("+8%", "Q1"),
            tagV: "green" as const,
            value: "฿ 770M",
            sub: p.kpi.activeDeals(8),
          },
          {
            label: p.kpi.weightedRevenue,
            tag: p.kpi.vsQuarter("+15%", "Q1"),
            tagV: "green" as const,
            value: "฿ 8.2M",
            sub: p.kpi.probabilityWeighted,
          },
          {
            label: p.kpi.winRate,
            tag: "YTD 2026",
            tagV: "blue" as const,
            value: "68%",
            sub: p.kpi.industryAvg("52%"),
          },
          {
            label: p.kpi.avgCycle,
            tag: p.kpi.vsQuarter("+3d", "Q1"),
            tagV: "red" as const,
            value: p.kpi.days(18),
            sub: p.kpi.target(p.kpi.days(15)),
          },
        ].map((k) => (
          <Card key={k.label} variant="default" className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <p className="type-caption text-muted-foreground">{k.label}</p>
              <Tag text={k.tag} variant={k.tagV} size="small" />
            </div>
            <div className="mt-auto flex flex-col gap-1">
              <p className="type-h3 leading-none text-foreground">{k.value}</p>
              <p className="type-caption text-[var(--text-default-disabled)]">{k.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-72">
            <DropdownMultiple
              label={p.toolbar.productType}
              placeholder={p.toolbar.allProducts}
              options={[
                { value: "sn", label: p.product.sn },
                { value: "eq", label: p.product.eq },
                { value: "fi", label: p.product.fi },
                { value: "reit", label: p.product.reit },
                { value: "bond", label: p.product.bond },
              ]}
            />
          </div>
          <div className="w-full sm:w-52">
            <Dropdown
              label={p.toolbar.quarter}
              placeholder={p.toolbar.allQuarters}
              options={[
                { value: "q2-2026", label: "Q2 2026" },
                { value: "q1-2026", label: "Q1 2026" },
              ]}
            />
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          className="w-full sm:w-auto"
          leftIcon={<PlusIcon size={16} />}
          onClick={() => setShowModal(true)}
        >
          {p.toolbar.newProposal}
        </Button>
      </div>

      {/* Kanban Board */}
      {dealsLoading ? (
        <p className="type-body-2 py-10 text-center text-muted-foreground">{t.common.loading}</p>
      ) : dealsError ? (
        <ErrorState onRetry={retryDeals} />
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-3">
          {allStages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage);
            const isClosed = stage === "Closed Won" || stage === "Closed Lost";
            return (
              <KanbanColumn
                key={stage}
                stage={stage}
                deals={stageDeals}
                dimmed={isClosed}
                onAdvanceRequest={handleAdvanceRequest}
              />
            );
          })}
        </div>
      )}

      {/* Stage Advance Modal */}
      {advancing && (
        <StageAdvanceModal
          deal={advancing.deal}
          next={advancing.next}
          onConfirm={handleAdvanceConfirm}
          onCancel={() => setAdvancing(null)}
        />
      )}

      {/* New Proposal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <Modal
            variant="content"
            title={p.newProposal.title}
            actionLayout="none"
            onClose={() => {
              setShowModal(false);
              setNewProposal({ clientName: "", productType: "", dealSize: "" });
            }}
          >
            <div className="flex flex-col gap-4">
              <Input
                placeholder={p.newProposal.clientName}
                value={newProposal.clientName}
                onChange={(val) => setNewProposal((p) => ({ ...p, clientName: val }))}
              />
              <Dropdown
                placeholder={p.newProposal.productType}
                value={newProposal.productType}
                options={[
                  { value: "sn", label: p.product.sn },
                  { value: "eq", label: p.product.eq },
                  { value: "fi", label: p.product.fi },
                ]}
                onChange={(val) => setNewProposal((p) => ({ ...p, productType: val as string }))}
              />
              <Input
                placeholder={p.newProposal.dealSize}
                value={newProposal.dealSize}
                onChange={(val) => setNewProposal((p) => ({ ...p, dealSize: val }))}
              />
              <Button
                variant="primary"
                size="xl"
                className="w-full"
                onClick={() => {
                  setShowModal(false);
                  setNewProposal({ clientName: "", productType: "", dealSize: "" });
                }}
              >
                {p.newProposal.create}
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="w-full"
                onClick={() => {
                  setShowModal(false);
                  setNewProposal({ clientName: "", productType: "", dealSize: "" });
                }}
              >
                {t.common.cancel}
              </Button>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
