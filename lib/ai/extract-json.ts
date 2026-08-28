export function extractJsonFromResponse(message: {
    content?: string | null;
    refusal?: string | null;
    [key: string]: unknown;
}): string {
    if (message?.content && typeof message.content === "string") {
        return message.content;
    }

    const raw = JSON.stringify(message ?? {});
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
        const candidate = match[0];
        try {
            JSON.parse(candidate);
            return candidate;
        } catch {
            return "";
        }
    }
    return "";
}
