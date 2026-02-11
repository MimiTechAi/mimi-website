import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const meta = {
    title: 'Moleküle/Dialog',
    component: Dialog,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Dialog öffnen</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Profil bearbeiten</DialogTitle>
                    <DialogDescription>
                        Ändern Sie hier Ihre Profildaten. Klicken Sie auf Speichern.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" defaultValue="Max Mustermann" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">E-Mail</Label>
                        <Input id="email" defaultValue="max@example.com" className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Speichern</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
};

export const Confirmation: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive">Löschen</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sind Sie sicher?</DialogTitle>
                    <DialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten werden permanent gelöscht.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost">Abbrechen</Button>
                    <Button variant="destructive">Endgültig löschen</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
};
