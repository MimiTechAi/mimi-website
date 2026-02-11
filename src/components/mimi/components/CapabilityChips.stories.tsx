import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CapabilityChips } from '@/components/mimi/components/CapabilityChips';

const meta = {
    title: 'Organismen/CapabilityChips',
    component: CapabilityChips,
    parameters: {
        layout: 'centered',
        backgrounds: { default: 'dark' },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof CapabilityChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onPromptSelect: (prompt: string) => {
            console.log('Prompt selected:', prompt);
        },
    },
};

export const WithAction: Story = {
    args: {
        onPromptSelect: (prompt: string) => {
            alert(`Prompt ausgewählt: ${prompt}`);
        },
    },
    render: (args) => {
        return (
            <div className="max-w-lg mx-auto space-y-4">
                <p className="text-white/30 text-xs text-center uppercase tracking-wider">
                    Probiere es aus
                </p>
                <CapabilityChips {...args} />
            </div>
        );
    },
};
