import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const meta = {
    title: 'Atoms/Input',
    component: Input,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['text', 'email', 'password', 'number', 'tel', 'url'],
        },
        disabled: { control: 'boolean' },
        placeholder: { control: 'text' },
    },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { placeholder: 'Text eingeben...' },
};

export const WithLabel: Story = {
    render: () => (
        <div className="w-[300px] space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" placeholder="name@example.com" />
        </div>
    ),
};

export const Disabled: Story = {
    args: { placeholder: 'Deaktiviert', disabled: true, value: 'Nicht editierbar' },
};

export const WithError: Story = {
    render: () => (
        <div className="w-[300px] space-y-2">
            <Label htmlFor="error-input">Name</Label>
            <Input
                id="error-input"
                aria-invalid="true"
                aria-describedby="error-msg"
                defaultValue="Max"
                className="border-destructive"
            />
            <p id="error-msg" className="text-sm text-destructive">Bitte einen vollständigen Namen eingeben.</p>
        </div>
    ),
};

export const Password: Story = {
    args: { type: 'password', placeholder: '••••••••' },
};

export const File: Story = {
    args: { type: 'file' },
};
