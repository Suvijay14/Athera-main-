'use client'

import { useMemo, useState } from 'react'
import { useDashboardData } from '@/lib/hooks/useDashboardData'
import { filterTodayTasks, filterUrgentTasks, openTaskCount } from '@/lib/dashboard/task-filters'
import SuggestedNextAction from '@/components/dashboard/SuggestedNextAction'
import DashboardTaskRows from '@/components/dashboard/DashboardTaskRows'
import AddDashboardWidgetModal from '@/components/dashboard/AddDashboardWidgetModal'
import DashboardDynamicWidgets from '@/components/dashboard/DashboardDynamicWidgets'
import { useComponentLab } from '@/lib/hooks/useComponentLab'
import type { ComponentId } from '@/lib/components/types'

export default function DashboardOverview() {
  const { tasks, suggestionNote, loading } = useDashboardData()
  const {
    approvedIds,
    dashboardWidgets,
    addDashboardWidget,
    removeDashboardWidget,
    loading: labLoading,
  } = useComponentLab()
  const [addOpen, setAddOpen] = useState(false)

  const urgent = useMemo(() => filterUrgentTasks(tasks), [tasks])
  const today = useMemo(() => filterTodayTasks(tasks), [tasks])
  const open = openTaskCount(tasks)

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const dateLine = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const layoutIds = dashboardWidgets.map((w) => w.componentId)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-9 py-6 md:py-8 space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-jakarta text-headline-xl-mobile md:text-headline-xl text-primary tracking-tight">
            Good {timeOfDay}
          </h1>
          <p className="text-body-lg text-secondary mt-1">
            {dateLine}
            {open > 0 ? (
              <>
                {' '}
                · <span className="text-on-surface font-medium">{open} items need your attention</span>
              </>
            ) : (
              <> · Overview across all spaces</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add component
          </button>
        </div>
      </header>

      <SuggestedNextAction note={suggestionNote} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        <div className="card-v2 p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#A8423F] text-[20px]">warning</span>
            <h2 className="font-jakarta text-headline-md text-on-surface">Urgent</h2>
            {urgent.length > 0 && (
              <span className="ml-auto text-body-sm text-secondary">{urgent.length} items</span>
            )}
          </div>
          <DashboardTaskRows
            tasks={urgent}
            emptyMessage="Nothing urgent — due today and overdue items show here."
          />
        </div>

        <div className="card-v2 p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
            <h2 className="font-jakarta text-headline-md text-on-surface">Today</h2>
            {today.length > 0 && (
              <span className="ml-auto text-body-sm text-secondary">{today.length} open</span>
            )}
          </div>
          <DashboardTaskRows
            tasks={today}
            emptyMessage="Nothing else scheduled for today."
          />
        </div>
      </div>

      {!labLoading && (
        <DashboardDynamicWidgets
          widgets={dashboardWidgets}
          onRemove={(id: ComponentId) => {
            void removeDashboardWidget(id)
          }}
          space="school"
        />
      )}

      <AddDashboardWidgetModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        approvedIds={approvedIds}
        onLayoutIds={layoutIds}
        onAdd={(id) => {
          void addDashboardWidget(id)
        }}
      />
    </div>
  )
}
