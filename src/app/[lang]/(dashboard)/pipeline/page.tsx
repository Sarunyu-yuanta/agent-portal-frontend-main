"use client";

import { useState } from "react";
import { Card, Tag, Button, Modal, Input, Dropdown, DropdownMultiple } from "@sarunyu/system-one";
import { PlusIcon } from "@phosphor-icons/react";
import { usePipelineDeals } from "@/hooks/use-api";
import { StageAdvanceModal } from "./StageAdvanceModal";
import { KanbanColumn } from "./KanbanColumn";
import type { Deal, Stage } from "./pipeline-data";

export default function PipelinePage() {
  const strapiDeals = usePipelineDeals();
  const [showModal, setShowModal] = useState(false);
  const [newProposal, setNewProposal] = useState({ clientName: "", productType: "", dealSize: "" });
  const [deals, setDeals] = useState<Deal[]>(() => strapiDeals.map(d => ({ ...d })));
  const [dealsSource, setDealsSource] = useState(strapiDeals);
  if (dealsSource !== strapiDeals) {
    setDealsSource(strapiDeals);
    setDeals(strapiDeals.map(d => ({ ...d })));
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
      prev.map((d) => d.id === advancing.deal.id ? { ...d, stage: advancing.next } : d)
    );
    setAdvancing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {[
          { label: "Total Pipeline Value",  tag: "+8% vs Q1",  tagV: "green" as const, value: "฿ 770M",  sub: "8 active deals" },
          { label: "Weighted Est. Revenue", tag: "+15% vs Q1", tagV: "green" as const, value: "฿ 8.2M",  sub: "Probability-weighted" },
          { label: "Win Rate",              tag: "YTD 2026",   tagV: "blue" as const,  value: "68%",     sub: "Industry avg: 52%" },
          { label: "Avg Deal Cycle",        tag: "+3d vs Q1",  tagV: "red" as const,   value: "18 days", sub: "Target: 15 days" },
        ].map((k) => (
          <Card key={k.label} variant="default" className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <p className="type-caption text-muted-foreground">{k.label}</p>
              <Tag text={k.tag} variant={k.tagV} size="small" />
            </div>
            <div className="flex flex-col gap-1 mt-auto">
              <p className="type-h3 text-foreground leading-none">{k.value}</p>
              <p className="type-caption text-[var(--text-default-disabled)]">{k.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="w-full sm:w-72">
            <DropdownMultiple
              label="Product Type"
              placeholder="All Products"
              options={[
                { value: "sn", label: "Structured Note" },
                { value: "eq", label: "Equity Fund" },
                { value: "fi", label: "Fixed Income" },
                { value: "reit", label: "REITs" },
                { value: "bond", label: "Bond" },
              ]}
            />
          </div>
          <div className="w-full sm:w-52">
            <Dropdown
              label="Quarter"
              placeholder="All Quarters"
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
          New Proposal
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-5 overflow-x-auto pb-3">
        {allStages.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage);
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
            title="New Proposal"
            actionLayout="none"
            onClose={() => { setShowModal(false); setNewProposal({ clientName: "", productType: "", dealSize: "" }); }}
          >
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Client Name"
                value={newProposal.clientName}
                onChange={(val) => setNewProposal((p) => ({ ...p, clientName: val }))}
              />
              <Dropdown
                placeholder="Product Type"
                value={newProposal.productType}
                options={[
                  { value: "sn", label: "Structured Note" },
                  { value: "eq", label: "Equity Fund" },
                  { value: "fi", label: "Fixed Income" },
                ]}
                onChange={(val) => setNewProposal((p) => ({ ...p, productType: val as string }))}
              />
              <Input
                placeholder="Deal Size (฿)"
                value={newProposal.dealSize}
                onChange={(val) => setNewProposal((p) => ({ ...p, dealSize: val }))}
              />
              <Button variant="primary" size="xl" className="w-full" onClick={() => { setShowModal(false); setNewProposal({ clientName: "", productType: "", dealSize: "" }); }}>
                Create
              </Button>
              <Button variant="outline" size="xl" className="w-full" onClick={() => { setShowModal(false); setNewProposal({ clientName: "", productType: "", dealSize: "" }); }}>
                Cancel
              </Button>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
