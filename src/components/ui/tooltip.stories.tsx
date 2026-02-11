import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Info, HelpCircle, Settings } from 'lucide-react';

const meta = {
    title: 'Moleküle/Tooltip',
    component: Tooltip,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <TooltipProvider>
                <Story />
            </TooltipProvider>
        ),
    ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                    <Info className="w-4 h-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Mehr Informationen</p>
            </TooltipContent>
        </Tooltip>
    ),
};

export const Positions: Story = {
    render: () => (
        <div className="flex gap-8 items-center">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">Oben</Button>
                </TooltipTrigger>
                <TooltipContent side="top">Tooltip oben</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">Rechts</Button>
                </TooltipTrigger>
                <TooltipContent side="right">Tooltip rechts</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">Unten</Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Tooltip unten</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">Links</Button>
                </TooltipTrigger>
                <TooltipContent side="left">Tooltip links</TooltipContent>
            </Tooltip>
        </div>
    ),
};

export const WithIcon: Story = {
    render: () => (
        <div className="flex gap-4">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <HelpCircle className="w-4 h-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Hilfe anzeigen</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Einstellungen</TooltipContent>
            </Tooltip>
        </div>
    ),
};
