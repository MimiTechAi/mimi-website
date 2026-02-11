import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const meta = {
    title: 'Moleküle/Tabs',
    component: Tabs,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Tabs defaultValue="overview" className="w-[400px]">
            <TabsList>
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="pricing">Preise</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
                <Card>
                    <CardHeader>
                        <CardTitle>Übersicht</CardTitle>
                        <CardDescription>KI-gestützte Beratung für Ihr Unternehmen.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            MiMi Tech AI bietet maßgeschneiderte KI-Lösungen für verschiedene Branchen.
                        </p>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="features">
                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                        <CardDescription>Was wir bieten.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                            <li>Digitale Zwillinge</li>
                            <li>KI-Beratung</li>
                            <li>Edge-AI Lösungen</li>
                        </ul>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="pricing">
                <Card>
                    <CardHeader>
                        <CardTitle>Preise</CardTitle>
                        <CardDescription>Flexible Preismodelle.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Kontaktieren Sie uns für ein individuelles Angebot.
                        </p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    ),
};
