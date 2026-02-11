import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const meta = {
    title: 'Atoms/Skeleton',
    component: Skeleton,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className="w-[300px] space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    ),
};

export const Avatar: Story = {
    render: () => (
        <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
            </div>
        </div>
    ),
};

export const CardSkeleton: Story = {
    render: () => (
        <Card className="w-[350px]">
            <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <div className="pt-4">
                    <Skeleton className="h-9 w-24" />
                </div>
            </CardContent>
        </Card>
    ),
};
