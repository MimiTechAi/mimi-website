import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FormStepper, type FormStep } from '@/components/ui/FormStepper';

const meta = {
    title: 'Moleküle/FormStepper',
    component: FormStepper,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof FormStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleSteps: FormStep[] = [
    {
        title: 'Persönlich',
        description: 'Geben Sie Ihre Kontaktdaten ein',
        content: (
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm text-white/60">Name</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Max Mustermann" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm text-white/60">E-Mail</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="max@example.com" />
                </div>
            </div>
        ),
    },
    {
        title: 'Anliegen',
        description: 'Wählen Sie den gewünschten Service',
        content: (
            <div className="space-y-3">
                {['KI-Beratung', 'Digitale Zwillinge', 'Automatisierung'].map((s) => (
                    <div key={s} className="p-3 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:border-cyan-500/30 hover:bg-cyan-500/5 cursor-pointer transition-all">
                        {s}
                    </div>
                ))}
            </div>
        ),
    },
    {
        title: 'Nachricht',
        description: 'Beschreiben Sie Ihr Anliegen',
        content: (
            <div className="space-y-2">
                <label className="text-sm text-white/60">Ihre Nachricht</label>
                <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white min-h-[120px] resize-none"
                    placeholder="Wie können wir Ihnen helfen?"
                />
            </div>
        ),
    },
];

export const Default: Story = {
    args: {
        steps: sampleSteps,
        onComplete: () => alert('Formular abgesendet!'),
    },
};

export const WithCustomLabel: Story = {
    args: {
        steps: sampleSteps,
        onComplete: () => alert('Gesendet!'),
        submitLabel: 'Jetzt absenden',
    },
};

export const Submitting: Story = {
    args: {
        steps: sampleSteps,
        onComplete: () => { },
        isSubmitting: true,
    },
};
