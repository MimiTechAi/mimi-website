import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function CardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  )
}

export function ServiceCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border">
      <CardContent className="p-8">
        {/* Icon Skeleton */}
        <Skeleton className="h-16 w-16 rounded-lg mb-6" />
        
        {/* Title Skeleton */}
        <Skeleton className="h-8 w-3/4 mb-4" />
        
        {/* Description Skeleton */}
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        
        {/* Button Skeleton */}
        <Skeleton className="h-10 w-32 rounded-lg" />
      </CardContent>
    </Card>
  )
}

export function HeroSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full text-center space-y-8">
        {/* Badge Skeleton */}
        <Skeleton className="h-8 w-48 mx-auto rounded-full" />
        
        {/* Title Skeleton */}
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-16 w-4/5 mx-auto mb-6" />
        
        {/* Description Skeleton */}
        <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-6 w-2/3 mx-auto mb-8" />
        
        {/* CTA Buttons Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Skeleton className="h-12 w-48 rounded-lg" />
          <Skeleton className="h-12 w-48 rounded-lg" />
        </div>
      </div>
    </div>
  )
}