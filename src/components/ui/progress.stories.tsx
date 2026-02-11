import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Progress } from '@/components/ui/progress';

const meta = {
    title: 'Atoms/Progress',
    component: Progress,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    argTypes: {
        value: { control: { type: 'range', min: 0, max: 100 } },
    },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className="w-[300px]">
            <Progress value={60} />
        </div>
    ),
};

export const Empty: Story = {
    render: () => (
        <div className="w-[300px]">
            <Progress value={0} />
        </div>
    ),
};

export const Full: Story = {
    render: () => (
        <div className="w-[300px]">
            <Progress value={100} />
        </div>
    ),
};

export const AllStages: Story = {
    render: () => (
        <div className="w-[300px] space-y-4">
            <div className="space-y-1">
                <span className="text-xs text-white/50">0%</span>
                <Progress value={0} />
            </div>
            <div className="space-y-1">
                <span className="text-xs text-white/50">25%</span>
                <Progress value={25} />
            </div>
            <div className="space-y-1">
                <span className="text-xs text-white/50">50%</span>
                <Progress value={50} />
            </div>
            <div className="space-y-1">
                <span className="text-xs text-white/50">75%</span>
                <Progress value={75} />
            </div>
            <div className="space-y-1">
                <span className="text-xs text-white/50">100%</span>
                <Progress value={100} />
            </div>
        </div>
    ),
};
