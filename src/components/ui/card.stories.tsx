import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const meta = {
    title: 'Atoms/Card',
    component: Card,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Standard Karte</CardTitle>
                <CardDescription>Eine einfache Card-Komponente</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Karteninhalt kommt hier.</p>
            </CardContent>
            <CardFooter>
                <Button size="sm">Aktion</Button>
            </CardFooter>
        </Card>
    ),
};

export const Glass: Story = {
    render: () => (
        <div className="p-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
            <Card className="w-[350px] bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Glassmorphism</CardTitle>
                    <CardDescription className="text-white/60">
                        Durchscheinende Card mit Blur-Effekt
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-white/50">Premium Glaseffekt.</p>
                </CardContent>
            </Card>
        </div>
    ),
};

export const WithAllSections: Story = {
    render: () => (
        <Card className="w-[400px]">
            <CardHeader>
                <CardTitle>Vollständige Karte</CardTitle>
                <CardDescription>Alle Sektionen aktiv</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <p className="text-sm">Feature 1: KI-Beratung</p>
                    <p className="text-sm">Feature 2: Digitale Zwillinge</p>
                    <p className="text-sm">Feature 3: Automatisierung</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost" size="sm">Abbrechen</Button>
                <Button size="sm">Speichern</Button>
            </CardFooter>
        </Card>
    ),
};
