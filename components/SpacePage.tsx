import GreetingHeader from '@/components/GreetingHeader'
import ThinkOutLoud from '@/components/ThinkOutLoud'
import AthenasNote from '@/components/AthenasNote'
import TaskList from '@/components/TaskList'
import WeekCalendar from '@/components/WeekCalendar'
import DailyRhythm from '@/components/DailyRhythm'
import SpacesPanel from '@/components/SpacesPanel'
import SpaceFilesWidget from '@/components/SpaceFilesWidget'
import WorkspaceViews from '@/components/WorkspaceViews'

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
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 space-y-4">
            <SpacesPanel />
            <WorkspaceViews />
            <DailyRhythm />
          </div>

          <div className="col-span-9 space-y-4">
            <ThinkOutLoud space={space} />
            {showFilesWidget && <SpaceFilesWidget spaceSlug={space} />}
            <AthenasNote space={space} />

            <div className="grid grid-cols-2 gap-4">
              <TaskList />
              <WeekCalendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
