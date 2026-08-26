"use client";

import { useEffect, useRef } from "react";

export function ReminderTrigger() {
    const triggered = useRef(false);

    useEffect(() => {
        if (triggered.current) return;
        triggered.current = true;

        fetch("/api/whatsapp/check", { method: "POST" }).catch(() => {});
    }, []);

    return null;
}
