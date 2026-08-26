"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface LoggedPatient {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    billingType: string;
}

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
    loggedPatient: LoggedPatient | null;
    setStep1: (type: "ONLINE" | "IN_PERSON") => void;
    setStep2: (datos: Partial<BookingData>) => void;
    setStep3: (date: string, time: string) => void;
    reset: () => void;
}

function todayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function buildInitialData(loggedPatient: LoggedPatient | null): BookingData {
    if (loggedPatient) {
        return {
            type: "IN_PERSON",
            firstName: loggedPatient.firstName,
            lastName: loggedPatient.lastName,
            email: loggedPatient.email,
            phone: loggedPatient.phone,
            birthDate: loggedPatient.birthDate,
            goal: "",
            billingType: loggedPatient.billingType,
            date: todayString(),
            time: "",
        };
    }
    return {
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
}

const BookingContext = createContext<BookingContextType | null>(null);

interface BookingProviderProps {
    children: ReactNode;
    loggedPatient?: LoggedPatient | null;
}

export function BookingProvider({ children, loggedPatient = null }: BookingProviderProps) {
    const [data, setData] = useState<BookingData>(() => buildInitialData(loggedPatient));

    const setStep1 = (type: "ONLINE" | "IN_PERSON") => {
        setData((prev) => ({ ...prev, type }));
    };

    const setStep2 = (datos: Partial<BookingData>) => {
        setData((prev) => ({ ...prev, ...datos }));
    };

    const setStep3 = (date: string, time: string) => {
        setData((prev) => ({ ...prev, date, time }));
    };

    const reset = () => setData(buildInitialData(loggedPatient));

    return (
        <BookingContext.Provider value={{ data, loggedPatient, setStep1, setStep2, setStep3, reset }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBooking() {
    const ctx = useContext(BookingContext);
    if (!ctx) throw new Error("useBooking must be used within BookingProvider");
    return ctx;
}
