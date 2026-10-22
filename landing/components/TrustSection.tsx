import { CheckCircle2, RotateCcw, Mail, Shield } from 'lucide-react'

const ITEMS = [
  {
    icon: CheckCircle2,
    title: 'Asks first. Every change needs your OK.',
  },
  {
    icon: RotateCcw,
    title: 'Undo anything, anytime.',
  },
  {
    icon: Mail,
    title: 'Nothing sends without you.',
  },
  {
    icon: Shield,
    title: 'Your data is yours. Export everything.',
  },
] as const

export default function TrustSection() {
  return (
    <section className="landing-section px-5 sm:px-8 py-14 sm:py-16 max-w-6xl mx-auto border-t border-[var(--border)]">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
        {ITEMS.map(({ icon: Icon, title }) => (
          <div
            key={title}
            className="flex flex-col items-center text-center md:items-start md:text-left gap-3"
          >
            <Icon className="w-5 h-5 text-sage shrink-0" strokeWidth={1.75} aria-hidden />
            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">{title}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
