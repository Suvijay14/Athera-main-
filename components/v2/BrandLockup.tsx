import AtheraLogo from '@/components/v2/AtheraLogo'

export default function BrandLockup({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-space-md">
      <AtheraLogo className={compact ? 'h-7 w-7' : 'h-8 w-8'} />
      <div className="flex flex-col">
        <span className="font-jakarta text-headline-md text-primary tracking-tight">Athera</span>
        <span className="text-body-sm text-secondary">Life, in context</span>
      </div>
    </div>
  )
}
