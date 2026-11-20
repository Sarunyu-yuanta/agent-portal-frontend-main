"use client";

import { useMemo, useState } from "react";
import {
  getStockQuoteHistory,
  type StockChartRange,
  type StockProductDetail,
} from "@/features/catalog/stock/lib/stock-product-detail-data";
import { OrderBook } from "./OrderBook";
import { ChartRangeSelector, StockQuoteChart } from "./StockQuoteChart";
import { TimeAndSales } from "./TimeAndSales";

export function MarketInfoBody({ detail }: { detail: StockProductDetail }) {
  const [range, setRange] = useState<StockChartRange>("1D");
  const points = useMemo(() => getStockQuoteHistory(detail, range), [detail, range]);

  return (
    <>
      <div className="flex w-full flex-col">
        <StockQuoteChart points={points} range={range} currency={detail.currency} />
        <div className="mt-6 w-full">
          <ChartRangeSelector active={range} onChange={setRange} />
        </div>
      </div>
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <OrderBook detail={detail} />
        <TimeAndSales detail={detail} />
      </div>
    </>
  );
}
