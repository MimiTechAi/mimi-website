import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const meta = {
    title: 'Atoms/Select',
    component: Select,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className="w-[280px]">
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Service wählen" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Leistungen</SelectLabel>
                        <SelectItem value="ki-beratung">KI-Beratung</SelectItem>
                        <SelectItem value="digitale-zwillinge">Digitale Zwillinge</SelectItem>
                        <SelectItem value="automatisierung">Automatisierung</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    ),
};

export const WithLabel: Story = {
    render: () => (
        <div className="w-[280px] space-y-2">
            <Label>Branche</Label>
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Branche auswählen" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="bau">Bauwesen</SelectItem>
                    <SelectItem value="tech">Technologie</SelectItem>
                    <SelectItem value="urban">Stadtplanung</SelectItem>
                    <SelectItem value="enterprise">Unternehmen</SelectItem>
                </SelectContent>
            </Select>
        </div>
    ),
};

export const WithGroups: Story = {
    render: () => (
        <div className="w-[280px]">
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Zeitraum wählen" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Kurzfristig</SelectLabel>
                        <SelectItem value="1w">1 Woche</SelectItem>
                        <SelectItem value="2w">2 Wochen</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                        <SelectLabel>Langfristig</SelectLabel>
                        <SelectItem value="1m">1 Monat</SelectItem>
                        <SelectItem value="3m">3 Monate</SelectItem>
                        <SelectItem value="6m">6 Monate</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    ),
};
