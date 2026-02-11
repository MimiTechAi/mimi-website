import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from '@/components/ui/badge';

const meta = {
    title: 'Atoms/Badge',
    component: Badge,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'secondary', 'destructive', 'outline'],
        },
    },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { children: 'Badge', variant: 'default' },
};

export const Secondary: Story = {
    args: { children: 'Sekundär', variant: 'secondary' },
};

export const Destructive: Story = {
    args: { children: 'Fehler', variant: 'destructive' },
};

export const Outline: Story = {
    args: { children: 'Outline', variant: 'outline' },
};

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Sekundär</Badge>
            <Badge variant="destructive">Fehler</Badge>
            <Badge variant="outline">Outline</Badge>
        </div>
    ),
};
