"use client";

import type { ReactNode } from "react";
import { NotFoundState } from "@/components/ui/empty-state";
import { FixedIncomeDetail } from "@/features/catalog/fixed-income/components/FixedIncomeDetail";
import { FixedIncomeCompanyDetail } from "@/features/catalog/fixed-income/components/FixedIncomeCompanyDetail";
import type { FixedIncomeBond } from "@/features/catalog/fixed-income/lib/fixed-income-data";
import { GlobalBondDetail } from "@/features/catalog/global-bond/components/GlobalBondDetail";
import { GlobalBondAllPage } from "@/features/catalog/global-bond/components/GlobalBondAllPage";
import type { GlobalBondIssuerId } from "@/features/catalog/global-bond/lib/global-bond-data";
import { MutualFundDetail } from "@/features/catalog/mutual-fund/components/MutualFundDetail";
import { getMutualFund } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { InvestmentSolutionDetail } from "@/features/catalog/robo-advisory/components/InvestmentSolutionDetail";
import { getInvestmentSolution } from "@/features/catalog/robo-advisory/lib/investment-solution-data";
import { StructuredProductDetail } from "@/features/catalog/structured-product/components/StructuredProductDetail";
import { StructuredProductAllPage } from "@/features/catalog/structured-product/components/StructuredProductAllPage";
import { ThaiStructuredProductDetail } from "@/features/catalog/structured-product/components/ThaiStructuredProductDetail";
import { TopIdeaAllPage } from "@/features/catalog/top-idea/components/TopIdeaAllPage";
import { TopIdeaDetail } from "@/features/catalog/top-idea/components/TopIdeaDetail";
import {
  useFixedIncomeCompanyDetail,
  useGlobalBondIssuer,
} from "@/features/catalog/hooks/use-catalog";
import type { CatalogDetailState } from "@/features/catalog/hooks/use-catalog-detail-state";
import { useT } from "@/i18n/I18nProvider";
import {
  FixedIncomeCompanyDetailSkeleton,
  GlobalBondDetailSkeleton,
} from "./ProductDetailSkeletons";

/**
 * The detail view picked through the catalog's own state, or `null` to show
 * the catalog itself. Only used when URL navigation is not provided (e.g.
 * client pages).
 */
export function renderCatalogStateDetail({
  selectedMutualFundId,
  setSelectedMutualFundId,
  selectedThaiProduct,
  setSelectedThaiProduct,
  showAllGlobalBonds,
  setShowAllGlobalBonds,
  selectedGlobalBondIssuer,
  setSelectedGlobalBondIssuer,
  fixedIncomeView,
  setFixedIncomeView,
  selectedFixedIncomeBond,
  setSelectedFixedIncomeBond,
  selectedFixedIncomeCompany,
  setSelectedFixedIncomeCompany,
  resetFixedIncomeNav,
  selectedProduct,
  setSelectedProduct,
  selectedTopIdea,
  setSelectedTopIdea,
  selectedInvestmentSolution,
  setSelectedInvestmentSolution,
  showAllTopIdeas,
  setShowAllTopIdeas,
  showAllStructuredProducts,
  setShowAllStructuredProducts,
}: CatalogDetailState): ReactNode {
  if (selectedMutualFundId) {
    const fund = getMutualFund(selectedMutualFundId);
    if (fund) {
      return (
        <div className="flex w-full flex-col">
          <MutualFundDetail fund={fund} onBack={() => setSelectedMutualFundId(null)} />
        </div>
      );
    }
  }

  if (selectedThaiProduct) {
    return (
      <div className="flex w-full flex-col">
        <ThaiStructuredProductDetail
          product={selectedThaiProduct}
          onBack={() => setSelectedThaiProduct(null)}
        />
      </div>
    );
  }

  if (showAllGlobalBonds) {
    return (
      <div className="flex w-full flex-col">
        <GlobalBondAllPage onBack={() => setShowAllGlobalBonds(false)} />
      </div>
    );
  }

  if (selectedGlobalBondIssuer) {
    return (
      <div className="flex w-full flex-col">
        <InlineGlobalBondDetail
          issuerId={selectedGlobalBondIssuer}
          onBack={() => setSelectedGlobalBondIssuer(null)}
          onIssuerSelect={setSelectedGlobalBondIssuer}
        />
      </div>
    );
  }

  if (fixedIncomeView === "bond" && selectedFixedIncomeBond) {
    return (
      <div className="flex w-full flex-col">
        <FixedIncomeDetail
          bond={selectedFixedIncomeBond}
          onBack={() => {
            if (selectedFixedIncomeCompany) {
              setSelectedFixedIncomeBond(null);
              setFixedIncomeView("company");
            } else {
              resetFixedIncomeNav();
            }
          }}
          onCompanySelect={(companyId) => {
            setSelectedFixedIncomeCompany(companyId);
            setFixedIncomeView("company");
          }}
        />
      </div>
    );
  }

  if (fixedIncomeView === "company" && selectedFixedIncomeCompany) {
    return (
      <div className="flex w-full flex-col">
        <InlineFixedIncomeCompanyDetail
          companyId={selectedFixedIncomeCompany}
          onBack={() => {
            if (selectedFixedIncomeBond) {
              setSelectedFixedIncomeCompany(null);
              setFixedIncomeView("bond");
            } else {
              resetFixedIncomeNav();
            }
          }}
          onBondSelect={(bond) => {
            setSelectedFixedIncomeBond(bond);
            setFixedIncomeView("bond");
          }}
        />
      </div>
    );
  }

  if (selectedProduct) {
    return (
      <div className="flex w-full flex-col">
        <StructuredProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
        />
      </div>
    );
  }

  if (selectedTopIdea) {
    return (
      <div className="flex w-full flex-col">
        <TopIdeaDetail
          sector={selectedTopIdea}
          onBack={() => setSelectedTopIdea(null)}
          onProductSelect={(product) => setSelectedProduct(product)}
        />
      </div>
    );
  }

  const pickedSolution = selectedInvestmentSolution
    ? getInvestmentSolution(selectedInvestmentSolution)
    : undefined;
  if (pickedSolution) {
    return (
      <div className="flex w-full flex-col">
        <InvestmentSolutionDetail
          solution={pickedSolution}
          onBack={() => setSelectedInvestmentSolution(null)}
          onProductSelect={(product) => setSelectedProduct(product)}
        />
      </div>
    );
  }

  if (showAllTopIdeas) {
    return (
      <div className="flex w-full flex-col">
        <TopIdeaAllPage
          onBack={() => setShowAllTopIdeas(false)}
          onSelect={(sector) => setSelectedTopIdea(sector)}
        />
      </div>
    );
  }

  if (showAllStructuredProducts) {
    return (
      <div className="flex w-full flex-col">
        <StructuredProductAllPage
          onBack={() => setShowAllStructuredProducts(false)}
          onProductSelect={(product) => setSelectedProduct(product)}
        />
      </div>
    );
  }

  return null;
}

/**
 * The state-based (client page) counterparts of the catalog's
 * `global-bond/[issuerId]` and `fixed-income/company/[companyId]` routes: the
 * same lookup, in the same order — skeleton, then not-found, then the detail.
 */
function InlineGlobalBondDetail({
  issuerId,
  onBack,
  onIssuerSelect,
}: {
  issuerId: GlobalBondIssuerId;
  onBack: () => void;
  onIssuerSelect: (issuerId: GlobalBondIssuerId) => void;
}) {
  const t = useT();
  const { data: issuer, isLoading } = useGlobalBondIssuer(issuerId);
  if (isLoading) return <GlobalBondDetailSkeleton />;
  if (!issuer) return <NotFoundState message={t.products.notFound.issuer} onBack={onBack} />;
  return <GlobalBondDetail issuer={issuer} onBack={onBack} onIssuerSelect={onIssuerSelect} />;
}

function InlineFixedIncomeCompanyDetail({
  companyId,
  onBack,
  onBondSelect,
}: {
  companyId: string;
  onBack: () => void;
  onBondSelect: (bond: FixedIncomeBond) => void;
}) {
  const t = useT();
  const { data: detail, isLoading } = useFixedIncomeCompanyDetail(companyId);
  if (isLoading) {
    return <FixedIncomeCompanyDetailSkeleton hasSecondary={detail.secondaryBonds.length > 0} />;
  }
  if (!detail.company)
    return <NotFoundState message={t.products.notFound.company} onBack={onBack} />;
  return (
    <FixedIncomeCompanyDetail
      company={detail.company}
      primaryBonds={detail.primaryBonds}
      secondaryBonds={detail.secondaryBonds}
      onBack={onBack}
      onBondSelect={onBondSelect}
    />
  );
}
