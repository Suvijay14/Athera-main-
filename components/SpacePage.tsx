'use client'

import GreetingHeader from '@/components/GreetingHeader'
import ThinkOutLoud from '@/components/ThinkOutLoud'
import AtherasNote from '@/components/AtherasNote'
import TaskList from '@/components/TaskList'
import WeekCalendar from '@/components/WeekCalendar'
import DailyRhythm from '@/components/DailyRhythm'
import SpacesPanel from '@/components/SpacesPanel'
import SpaceFilesWidget from '@/components/SpaceFilesWidget'
import BCoursesWidget from '@/components/BCoursesWidget'
import WorkspaceViews from '@/components/WorkspaceViews'
import ResizableWidget from '@/components/ResizableWidget'
import ResizableSidebar from '@/components/ResizableSidebar'

interface SpacePageProps {
  space: string
  label: string
  /** When set, show files widget for voice-created spaces */
  showFilesWidget?: boolean
}

export default function SpacePage({ space, label, showFilesWidget }: SpacePageProps) {
  return (
    <div className="min-h-full">
      <GreetingHeader space={label} />

      <div className="p-8">
        <ResizableSidebar
          defaultWidth={300}
          minWidth={220}
          maxWidth={520}
          main={
            <div className="space-y-4">
              <ResizableWidget id="think-out-loud" defaultHeight={120} minHeight={96} maxHeight={240}>
                <ThinkOutLoud space={space} />
              </ResizableWidget>

              {showFilesWidget && (
                <ResizableWidget id="space-files" defaultHeight={260} minHeight={160} maxHeight={480}>
                  <SpaceFilesWidget spaceSlug={space} />
                </ResizableWidget>
              )}

              <ResizableWidget id="atheras-note" defaultHeight={220} minHeight={160} maxHeight={480}>
                <AtherasNote space={space} />
              </ResizableWidget>

              <div className="flex gap-4 items-start overflow-x-auto pb-1">
                <ResizableWidget
                  id="task-list"
                  defaultHeight={420}
                  minHeight={240}
                  maxHeight={720}
                  defaultWidth={480}
                  minWidth={300}
                  maxWidth={900}
                >
                  <TaskList />
                </ResizableWidget>
                <ResizableWidget
                  id="week-calendar"
                  defaultHeight={420}
                  minHeight={240}
                  maxHeight={720}
                  defaultWidth={480}
                  minWidth={300}
                  maxWidth={900}
                  flex
                >
                  <WeekCalendar />
                </ResizableWidget>
              </div>
            </div>
          }
        >
          <ResizableWidget id="spaces-panel" defaultHeight={240} minHeight={160} maxHeight={480}>
            <SpacesPanel />
          </ResizableWidget>

          {space === 'school' && (
            <ResizableWidget id="bcourses" defaultHeight={380} minHeight={200} maxHeight={720}>
              <BCoursesWidget />
            </ResizableWidget>
          )}

          <ResizableWidget id="workspace-views" defaultHeight={180} minHeight={120} maxHeight={360}>
            <WorkspaceViews />
          </ResizableWidget>

          <ResizableWidget id="daily-rhythm" defaultHeight={200} minHeight={140} maxHeight={400}>
            <DailyRhythm />
          </ResizableWidget>
        </ResizableSidebar>
      </div>
    </div>
  )
}
