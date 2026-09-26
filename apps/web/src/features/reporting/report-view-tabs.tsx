'use client';

import { BarChart3, Table2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type ReportView = 'table' | 'chart';

/**
 * Table/Chart switch shared by report pages whose data has a categorical
 * breakdown worth visualizing. Reports with only a single total (e.g. cash
 * flow's net change) skip this - a chart of one number adds nothing over
 * the stat card already shown.
 */
export function ReportViewTabs({
  view,
  onViewChange,
  table,
  chart,
}: {
  view: ReportView;
  onViewChange: (view: ReportView) => void;
  table: React.ReactNode;
  chart: React.ReactNode;
}) {
  return (
    <Tabs value={view} onValueChange={(value) => onViewChange(value as ReportView)}>
      <TabsList>
        <TabsTrigger value="table">
          <Table2 className="size-4" />
          Table
        </TabsTrigger>
        <TabsTrigger value="chart">
          <BarChart3 className="size-4" />
          Chart
        </TabsTrigger>
      </TabsList>
      <TabsContent value="table" className="mt-4">
        {table}
      </TabsContent>
      <TabsContent value="chart" className="mt-4">
        {chart}
      </TabsContent>
    </Tabs>
  );
}
