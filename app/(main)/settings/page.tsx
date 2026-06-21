"use client";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Switch } from "@/slids/components/ui/switch";
import { Label } from "@/slids/components/ui/label";
import { Button } from "@/slids/components/ui/button";
import { Bell, Lock, Globe, Palette } from "lucide-react";
import { useUi } from "@/slids/store";

export default function Settings() {
    const { darkMode, toggleDark } = useUi();
    return (
        <PageTransition>
            <PageHeader title="Settings" description="App preferences, notifications and security." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                    { icon: Palette, title: "Appearance", rows: [{ l: "Dark mode", c: <Switch checked={darkMode} onCheckedChange={toggleDark} /> }, { l: "Compact density", c: <Switch /> }] },
                    { icon: Bell, title: "Notifications", rows: [{ l: "Email digest", c: <Switch defaultChecked /> }, { l: "Lead alerts", c: <Switch defaultChecked /> }, { l: "Visa updates", c: <Switch defaultChecked /> }] },
                    { icon: Lock, title: "Security", rows: [{ l: "Two-factor authentication", c: <Switch /> }, { l: "Active session limit (3)", c: <Switch defaultChecked /> }] },
                    { icon: Globe, title: "Locale", rows: [{ l: "Currency: INR (₹)", c: <Button size="sm" variant="outline">Change</Button> }, { l: "Timezone: Asia/Kolkata", c: <Button size="sm" variant="outline">Change</Button> }] },
                ].map((s) => (
                    <Card key={s.title}><CardContent className="p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="size-9 rounded-lg bg-accent flex items-center justify-center"><s.icon className="size-4 text-primary" /></div>
                            <div className="font-semibold">{s.title}</div>
                        </div>
                        <div className="space-y-3">{s.rows.map((r) => (
                            <div key={r.l} className="flex items-center justify-between"><Label className="font-normal">{r.l}</Label>{r.c}</div>
                        ))}</div>
                    </CardContent></Card>
                ))}
            </div>
        </PageTransition>
    );
}
