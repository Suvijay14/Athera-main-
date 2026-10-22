'use client'

import FeatureSection from '@/components/landing/features/FeatureSection'
import FeatureBuildDemo from '@/components/landing/features/FeatureBuildDemo'
import FeaturePeopleDemo from '@/components/landing/features/FeaturePeopleDemo'
import FeatureQuietDemo from '@/components/landing/features/FeatureQuietDemo'
import FeatureRepeatDemo from '@/components/landing/features/FeatureRepeatDemo'
import FeatureImportDemo from '@/components/landing/features/FeatureImportDemo'

export default function LandingFeatureSections() {
  return (
    <div className="landing-section-alt">
      <FeatureSection
        index="01"
        label="IT BUILDS ITSELF"
        headline="Add your work. Athera builds the structure."
        body="Drop in tasks the way you already think about them. Athera groups the work and opens the view you need—list, calendar, or by client—without a setup project."
        pill="NO SETUP, EVER"
        demo={<FeatureBuildDemo />}
      />
      <FeatureSection
        index="02"
        label="IT KNOWS YOUR CLIENTS"
        headline="Everything about every client, in one place."
        body="Each client gets a page that pulls in work, notes, and the people around them—so you never dig through five apps for context."
        pill="THE WHOLE STORY, AT A GLANCE"
        demo={<FeaturePeopleDemo />}
        reverse
      />
      <FeatureSection
        index="03"
        label="IT CATCHES WHAT SLIPS"
        headline="Win back the client before they're gone."
        body="When someone's overdue, Athera surfaces it early and drafts a follow-up. You choose whether to send, edit, or ignore."
        pill="NOTHING SENDS WITHOUT YOU"
        demo={<FeatureQuietDemo />}
      />
      <FeatureSection
        index="04"
        label="IT STOPS REPEAT WORK"
        headline="Typed it three weeks in a row? It repeats now."
        body="Athera notices patterns in what you add and offers to repeat them—one tap, and you stop retyping the same thing."
        pill="SAY IT ONCE"
        demo={<FeatureRepeatDemo />}
        reverse
      />
      <FeatureSection
        index="05"
        label="START IN 60 SECONDS"
        headline="Paste your messy week. Watch it organize."
        body="Bring a messy list or a calendar export. Athera sorts it into spaces and clients—you approve before anything sticks."
        pill="NOTHING TO SET UP"
        demo={<FeatureImportDemo />}
      />
    </div>
  )
}
