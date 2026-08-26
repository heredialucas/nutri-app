import prisma from "@/lib/prisma";
import { sendNotification } from "@/lib/whatsapp-sender";
import { formatInTimeZone } from "date-fns-tz";

const AR_TZ = "America/Argentina/Buenos_Aires";

const NUTRITION_TIPS = [
    "Hoy te recomiendo incluir una porción de verduras de hoja verde en tu almuerzo. Espinaca, acelga o rúcula son excelentes opciones.",
    "Recordá hidratarte bien durante el día. Tomar agua antes de cada comida puede ayudarte a regular el apetito.",
    "Una merienda con proteína (yogur, queso fresco, huevo) te da energía sostenida y evita los antojos de la tarde.",
    "Las legumbres son una excelente fuente de proteína vegetal. Tratá de incluirlas al menos 3 veces por semana.",
    "El ejercicio físico liviano después de comer (como caminar 15 minutos) ayuda a regular la glucosa en sangre.",
    "Conocé tus porciones: un puñado de frutos secos es aproximadamente 30g. Medir al principio te ayuda a interiorizar las cantidades.",
    "Los aceites vegetales (oliva, girasol) son saludables pero calóricos. Una cucharada es una buena porción para cocinar.",
    "Comé despacio y masticá bien. Tu cerebro tarda aproximadamente 20 minutos en registrar la sensación de saciedad.",
    "Incluí una fruta como postre en lugar de dulces procesados. Aportás fibra, vitaminas y menos azúcar.",
    "Planificar las comidas de la semana ayuda a mantener la adherencia al plan y ahorrar tiempo.",
];

export const reminderService = {
    async checkAndSendForUser(userId: string): Promise<
        { type: string; sent: boolean; reason: string }[]
    > {
        const results: { type: string; sent: boolean; reason: string }[] = [];

        const settings = await prisma.whatsAppSetting.findUnique({
            where: { userId },
        });

        if (!settings || !settings.enabled) return results;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                patient: true,
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!user) return results;

        const isPatient = user.userRoles.some(
            (ur) => ur.role.name === "PATIENT",
        );

        if (isPatient && user.patient) {
            const patientResults = await this.checkPatientReminders(
                userId,
                user.patient.id,
                settings,
            );
            results.push(...patientResults);
        } else {
            const proResults = await this.checkProfessionalReminders(
                userId,
                settings,
            );
            results.push(...proResults);
        }

        return results;
    },

    async checkPatientReminders(
        userId: string,
        patientId: string,
        settings: {
            notifPlanDelDia: boolean;
            notifTurno24h: boolean;
            notifTurno2h: boolean;
            notifTipsRecetas: boolean;
            notifSeguimientoSemanal: boolean;
        },
    ) {
        const results: { type: string; sent: boolean; reason: string }[] = [];
        const now = new Date();

        if (settings.notifPlanDelDia) {
            const result = await this.sendDailyMeals(
                userId,
                patientId,
            );
            results.push({ type: "PLAN_DEL_DIA", ...result });
        }

        if (settings.notifTurno24h) {
            const result = await this.sendAppointmentReminder(
                userId,
                patientId,
                24,
            );
            results.push({ type: "TURNO_24H", ...result });
        }

        if (settings.notifTurno2h) {
            const result = await this.sendAppointmentReminder(
                userId,
                patientId,
                2,
            );
            results.push({ type: "TURNO_2H", ...result });
        }

        if (settings.notifTipsRecetas) {
            const result = await this.sendDailyTip(userId);
            results.push({ type: "TIP_DEL_DIA", ...result });
        }

        if (settings.notifSeguimientoSemanal) {
            const result = await this.sendWeeklyFollowupReminder(
                userId,
                patientId,
            );
            results.push({ type: "SEGUIMIENTO_SEMANAL", ...result });
        }

        return results;
    },

    async checkProfessionalReminders(
        userId: string,
        settings: {
            notifTurnosHoy: boolean;
            notifTurnosManana: boolean;
            notifSeguimientosPendientes: boolean;
            notifPacientesInactivos: boolean;
        },
    ) {
        const results: { type: string; sent: boolean; reason: string }[] = [];

        if (settings.notifTurnosHoy) {
            const result = await this.sendTodayAppointments(userId);
            results.push({ type: "TURNOS_HOY", ...result });
        }

        if (settings.notifTurnosManana) {
            const result = await this.sendTomorrowAppointments(userId);
            results.push({ type: "TURNOS_MANANA", ...result });
        }

        if (settings.notifSeguimientosPendientes) {
            const result =
                await this.sendPendingFollowups(userId);
            results.push({ type: "SEGUIMIENTOS_PENDIENTES", ...result });
        }

        return results;
    },

    async sendDailyMeals(
        userId: string,
        patientId: string,
    ): Promise<{ sent: boolean; reason: string }> {
        const activePlan = await prisma.nutritionPlan.findFirst({
            where: {
                patientId,
                status: "ACTIVE",
            },
            include: {
                days: {
                    include: {
                        meals: {
                            include: { foods: true },
                            orderBy: { mealOrder: "asc" },
                        },
                    },
                    orderBy: { dayOrder: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!activePlan) {
            return { sent: false, reason: "Sin plan activo" };
        }

        const now = new Date();
        const dayOfWeek = now.getDay();
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const todayPlan = activePlan.days.find(
            (d) => d.dayOrder === dayIndex,
        );

        if (!todayPlan) {
            return { sent: false, reason: "Sin plan para hoy" };
        }

        const dayNames = [
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
            "Domingo",
        ];

        let message = `🍽️ *Tu plan de hoy — ${dayNames[dayIndex]}*\n`;
        message += `📋 ${activePlan.title}\n\n`;

        for (const meal of todayPlan.meals) {
            message += `*${meal.label}*\n`;
            for (const food of meal.foods) {
                const quantity = food.quantity
                    ? `${food.quantity}${food.unit ? " " + food.unit : ""}`
                    : "";
                const notes = food.notes ? ` (${food.notes})` : "";
                message += `  • ${food.name}${quantity ? " — " + quantity : ""}${notes}\n`;
            }
            message += "\n";
        }

        message += "¡Buen provecho! 💪";

        return sendNotification(userId, "PLAN_DEL_DIA", message);
    },

    async sendAppointmentReminder(
        userId: string,
        patientId: string,
        hoursAhead: number,
    ): Promise<{ sent: boolean; reason: string }> {
        const now = new Date();
        const targetDate = new Date(
            now.getTime() + hoursAhead * 60 * 60 * 1000,
        );

        const startWindow = new Date(targetDate);
        startWindow.setMinutes(startWindow.getMinutes() - 30);

        const endWindow = new Date(targetDate);
        endWindow.setMinutes(endWindow.getMinutes() + 30);

        const appointment = await prisma.appointment.findFirst({
            where: {
                patientId,
                status: { in: ["PENDING", "CONFIRMED"] },
                startAt: { gte: startWindow, lte: endWindow },
            },
            include: {
                professional: {
                    select: { fullName: true },
                },
            },
        });

        if (!appointment) {
            return { sent: false, reason: `Sin turno en ${hoursAhead}h` };
        }

        const timeStr = formatInTimeZone(appointment.startAt, AR_TZ, "HH:mm");

        const typeStr =
            appointment.type === "ONLINE" ? "Online" : "Presencial";
        const locationStr =
            appointment.type === "ONLINE" && appointment.meetingUrl
                ? `\n🔗 Link: ${appointment.meetingUrl}`
                : appointment.location
                  ? `\n📍 ${appointment.location}`
                  : "";

        const message =
            hoursAhead === 24
                ? `⏰ *Recordatorio — Turno mañana*\n\n` +
                  `HS ${timeStr} — ${typeStr}\n` +
                  `Con: ${appointment.professional.fullName}` +
                  locationStr +
                  `\n\n¡Nos vemos mañana!`
                : `⏰ *Tu turno es en ${hoursAhead} horas*\n\n` +
                  `HS ${timeStr} — ${typeStr}\n` +
                  `Con: ${appointment.professional.fullName}` +
                  locationStr;

        return sendNotification(userId, `TURNO_${hoursAhead}H`, message);
    },

    async sendDailyTip(
        userId: string,
    ): Promise<{ sent: boolean; reason: string }> {
        const today = new Date();
        const dayOfYear = Math.floor(
            (today.getTime() -
                new Date(today.getFullYear(), 0, 0).getTime()) /
                86400000,
        );
        const tipIndex = dayOfYear % NUTRITION_TIPS.length;
        const tip = NUTRITION_TIPS[tipIndex];

        const message = `💡 *Tip del día*\n\n${tip}\n\n— Mauro Acosta`;

        return sendNotification(userId, "TIP_DEL_DIA", message);
    },

    async sendWeeklyFollowupReminder(
        userId: string,
        patientId: string,
    ): Promise<{ sent: boolean; reason: string }> {
        const now = new Date();
        const dayOfWeek = now.getDay();

        if (dayOfWeek !== 1) {
            return { sent: false, reason: "Solo se envía los lunes" };
        }

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const existingFollowup = await prisma.followUp.findFirst({
            where: {
                patientId,
                weekStart: startOfWeek,
            },
        });

        if (existingFollowup) {
            return { sent: false, reason: "Check-in ya completado" };
        }

        const message =
            `📝 *Seguimiento semanal*\n\n` +
            `Hola! Es lunes y te toca completar tu check-in semanal.\n\n` +
            `¿Cómo te fue esta semana? Contanos:\n` +
            `• Peso actual\n` +
            `• adherence al plan\n` +
            `• Nivel de energía\n` +
            `• Dificultades\n\n` +
            `Ingresá a tu portal para completarlo.\n\n` +
            `— Mauro Acosta`;

        return sendNotification(
            userId,
            "SEGUIMIENTO_SEMANAL",
            message,
        );
    },

    async sendTodayAppointments(
        professionalId: string,
    ): Promise<{ sent: boolean; reason: string }> {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const appointments = await prisma.appointment.findMany({
            where: {
                professionalId,
                status: { in: ["PENDING", "CONFIRMED"] },
                startAt: { gte: startOfDay, lte: endOfDay },
            },
            include: {
                patient: {
                    select: { firstName: true, lastName: true },
                },
            },
            orderBy: { startAt: "asc" },
        });

        if (appointments.length === 0) {
            return { sent: false, reason: "Sin turnos hoy" };
        }

        let message = `📅 *Turnos de hoy*\n\n`;

        for (const apt of appointments) {
            const timeStr = formatInTimeZone(apt.startAt, AR_TZ, "HH:mm");
            const typeStr =
                apt.type === "ONLINE" ? "💻" : "🏥";
            message += `${timeStr} — ${typeStr} ${apt.patient.firstName} ${apt.patient.lastName}\n`;
        }

        message += `\nTotal: ${appointments.length} turno(s)`;

        return sendNotification(
            professionalId,
            "TURNOS_HOY",
            message,
        );
    },

    async sendTomorrowAppointments(
        professionalId: string,
    ): Promise<{ sent: boolean; reason: string }> {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfDay = new Date(tomorrow);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(tomorrow);
        endOfDay.setHours(23, 59, 59, 999);

        const appointments = await prisma.appointment.findMany({
            where: {
                professionalId,
                status: { in: ["PENDING", "CONFIRMED"] },
                startAt: { gte: startOfDay, lte: endOfDay },
            },
            include: {
                patient: {
                    select: { firstName: true, lastName: true },
                },
            },
            orderBy: { startAt: "asc" },
        });

        if (appointments.length === 0) {
            return { sent: false, reason: "Sin turnos mañana" };
        }

        const dayNames = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
        ];
        const dayName = dayNames[tomorrow.getDay()];

        let message = `📅 *Turnos de mañana — ${dayName}*\n\n`;

        for (const apt of appointments) {
            const timeStr = formatInTimeZone(apt.startAt, AR_TZ, "HH:mm");
            const typeStr =
                apt.type === "ONLINE" ? "💻" : "🏥";
            message += `${timeStr} — ${typeStr} ${apt.patient.firstName} ${apt.patient.lastName}\n`;
        }

        message += `\nTotal: ${appointments.length} turno(s)`;

        return sendNotification(
            professionalId,
            "TURNOS_MANANA",
            message,
        );
    },

    async sendPendingFollowups(
        professionalId: string,
    ): Promise<{ sent: boolean; reason: string }> {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const activePatients = await prisma.patient.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, firstName: true, lastName: true },
        });

        const patientsWithFollowup = await prisma.followUp.findMany({
            where: {
                weekStart: startOfWeek,
                patientId: {
                    in: activePatients.map((p) => p.id),
                },
            },
            select: { patientId: true },
        });

        const followedUpIds = new Set(
            patientsWithFollowup.map((f) => f.patientId),
        );

        const pending = activePatients.filter(
            (p) => !followedUpIds.has(p.id),
        );

        if (pending.length === 0) {
            return { sent: false, reason: "Todos al día" };
        }

        let message = `📋 *Seguimientos pendientes esta semana*\n\n`;

        for (const p of pending.slice(0, 10)) {
            message += `• ${p.firstName} ${p.lastName}\n`;
        }

        if (pending.length > 10) {
            message += `... y ${pending.length - 10} más\n`;
        }

        message += `\nTotal: ${pending.length} paciente(s) sin check-in`;

        return sendNotification(
            professionalId,
            "SEGUIMIENTOS_PENDIENTES",
            message,
        );
    },
};
