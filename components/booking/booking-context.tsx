"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { LoggedPatient } from "./booking-layout-client";

export interface BookingData {
    type: "ONLINE" | "IN_PERSON";
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    goal: string;
    billingType: string;
    date: string;
    time: string;
}

interface BookingContextType {
    data: BookingData;
    isPrefilled: boolean;
    loggedPatient: LoggedPatient | null;
    setStep1: (type: "ONLINE" | "IN_PERSON") => void;
    setStep2: (datos: Partial<BookingData>) => void;
    setStep3: (date: string, time: string) => void;
    prefill: (datos: Partial<BookingData>) => void;
    reset: () => void;
}

const initialData: BookingData = {
    type: "IN_PERSON",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    goal: "",
    billingType: "particular",
    date: "",
    time: "",
};

const BookingContext = createContext<BookingContextType | null>(null);

interface BookingProviderProps {
    children: ReactNode;
    loggedPatient?: LoggedPatient | null;
}

export function BookingProvider({ children, loggedPatient = null }: BookingProviderProps) {
    const [data, setData] = useState<BookingData>(() => {
        if (loggedPatient) {
            return {
                ...initialData,
                firstName: loggedPatient.firstName,
                lastName: loggedPatient.lastName,
                email: loggedPatient.email,
                phone: loggedPatient.phone,
                birthDate: loggedPatient.birthDate,
                billingType: loggedPatient.billingType,
            };
        }
        return initialData;
    });
    const [isPrefilled, setIsPrefilled] = useState(!!loggedPatient);

    const setStep1 = (type: "ONLINE" | "IN_PERSON") => {
        setData((prev) => ({ ...prev, type }));
    };

    const setStep2 = (datos: Partial<BookingData>) => {
        setData((prev) => ({ ...prev, ...datos }));
    };

    const setStep3 = (date: string, time: string) => {
        setData((prev) => ({ ...prev, date, time }));
    };

    const prefill = useCallback((datos: Partial<BookingData>) => {
        setData((prev) => ({ ...prev, ...datos }));
        setIsPrefilled(true);
    }, []);

    const reset = () => {
        setData(initialData);
        setIsPrefilled(false);
    };

    return (
        <BookingContext.Provider value={{ data, isPrefilled, loggedPatient, setStep1, setStep2, setStep3, prefill, reset }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBooking() {
    const ctx = useContext(BookingContext);
    if (!ctx) throw new Error("useBooking must be used within BookingProvider");
    return ctx;
}
