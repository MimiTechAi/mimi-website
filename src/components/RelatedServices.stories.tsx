import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RelatedServices } from '@/components/RelatedServices';

const meta = {
    title: 'Organismen/RelatedServices',
    component: RelatedServices,
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'dark' },
    },
    tags: ['autodocs'],
    argTypes: {
        currentSlug: {
            control: 'select',
            options: ['ki-beratung', 'digitale-zwillinge', 'ki-erklaert', 'about', 'contact'],
        },
    },
} satisfies Meta<typeof RelatedServices>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FromKIBeratung: Story = {
    args: { currentSlug: 'ki-beratung' },
};

export const FromDigitaleZwillinge: Story = {
    args: { currentSlug: 'digitale-zwillinge' },
};

export const FromKIErklaert: Story = {
    args: { currentSlug: 'ki-erklaert' },
};

export const FromAbout: Story = {
    args: { currentSlug: 'about' },
};

export const FromContact: Story = {
    args: { currentSlug: 'contact' },
};
