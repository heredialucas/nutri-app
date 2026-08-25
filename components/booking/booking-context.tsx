"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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
    setStep1: (type: "ONLINE" | "IN_PERSON") => void;
    setStep2: (datos: Partial<BookingData>) => void;
    setStep3: (date: string, time: string) => void;
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

export function BookingProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<BookingData>(initialData);

    const setStep1 = (type: "ONLINE" | "IN_PERSON") => {
        setData((prev) => ({ ...prev, type }));
    };

    const setStep2 = (datos: Partial<BookingData>) => {
        setData((prev) => ({ ...prev, ...datos }));
    };

    const setStep3 = (date: string, time: string) => {
        setData((prev) => ({ ...prev, date, time }));
    };

    const reset = () => setData(initialData);

    return (
        <BookingContext.Provider value={{ data, setStep1, setStep2, setStep3, reset }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBooking() {
    const ctx = useContext(BookingContext);
    if (!ctx) throw new Error("useBooking must be used within BookingProvider");
    return ctx;
}
