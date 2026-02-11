import { HeroSkeleton } from "@/components/ui/card-skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSkeleton />
    </div>
  )
}