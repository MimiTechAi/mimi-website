import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@/components/ui/button';
import { Mail, Download, Trash2, Plus, Settings, ArrowRight } from 'lucide-react';

const meta = {
    title: 'Atoms/Button',
    component: Button,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
        },
        size: {
            control: 'select',
            options: ['default', 'sm', 'lg', 'icon'],
        },
        disabled: { control: 'boolean' },
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { children: 'Button', variant: 'default', size: 'default' },
};

export const Destructive: Story = {
    args: { children: 'Löschen', variant: 'destructive' },
};

export const Outline: Story = {
    args: { children: 'Outline', variant: 'outline' },
};

export const Secondary: Story = {
    args: { children: 'Sekundär', variant: 'secondary' },
};

export const Ghost: Story = {
    args: { children: 'Ghost', variant: 'ghost' },
};

export const Link: Story = {
    args: { children: 'Link Button', variant: 'link' },
};

export const Small: Story = {
    args: { children: 'Klein', size: 'sm' },
};

export const Large: Story = {
    args: { children: 'Groß', size: 'lg' },
};

export const Icon: Story = {
    args: { size: 'icon', children: <Plus className="w-4 h-4" /> },
};

export const WithIcon: Story = {
    args: { children: <><Mail className="w-4 h-4" /> E-Mail senden</> },
};

export const WithTrailingIcon: Story = {
    args: { children: <>Weiter <ArrowRight className="w-4 h-4" /></> },
};

export const Disabled: Story = {
    args: { children: 'Deaktiviert', disabled: true },
};

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-wrap gap-4 items-center">
            <Button variant="default">Default</Button>
            <Button variant="destructive"><Trash2 className="w-4 h-4" /> Löschen</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Sekundär</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
        </div>
    ),
};

export const AllSizes: Story = {
    render: () => (
        <div className="flex flex-wrap gap-4 items-center">
            <Button size="sm">Klein</Button>
            <Button size="default">Standard</Button>
            <Button size="lg">Groß</Button>
            <Button size="icon"><Settings className="w-4 h-4" /></Button>
        </div>
    ),
};
