/**
 * useDisclaimerDetection — Fachbereich-Erkennung für MIMI Agent
 *
 * Erkennt medizinische, rechtliche und finanzielle Inhalte in MIMI-Antworten
 * und gibt einen Disclaimer-Typ zurück, damit MessageBubble einen Hinweis anzeigen kann.
 *
 * Adressiert Interview-Feedback:
 * - Dr. Michael (Arzt): „Ich brauche eine Warnung bei medizinischen Informationen"
 * - Dr. Anna (Anwältin): „KI-Ausgaben ersetzen keine Rechtsberatung — das fehlt komplett"
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

export type DisclaimerDomain = "medical" | "legal" | "financial" | "tax" | null;

export interface DisclaimerResult {
    showDisclaimer: boolean;
    domain: DisclaimerDomain;
    label: string;
    detail: string;
}

// ── Keyword-Sets pro Fachbereich ─────────────────────────────────────────────

const MEDICAL_KEYWORDS = [
    // Diagnose & Codes
    "icd-", "icd10", "icd 10", "diagnose", "symptom", "befund", "anamnese",
    "medikament", "dosierung", "wirkstoff", "nebenwirkung", "kontraindikation",
    // Behandlung
    "therapie", "behandlung", "operation", "eingriff", "chirurgie",
    "arztbrief", "überweisung", "rezept", "verschreibung",
    // Fachbegriffe
    "diabetes", "hypertonie", "kardiologie", "onkologie", "neurologie",
    "blutdruck", "blutzucker", "cholesterin", "herzinfarkt", "schlaganfall",
    "antibiotikum", "impfung", "vakzin", "laborwert",
];

const LEGAL_KEYWORDS = [
    // Rechtsgebiete
    "paragraph", "§", "bgh", "bverfg", "urteil", "beschluss", "klage",
    "vertrag", "kündigung", "abmahnung", "schadensersatz", "haftung",
    // DSGVO & Compliance
    "dsgvo", "datenschutz", "auftragsverarbeitung", "einwilligung",
    "strafrecht", "zivilrecht", "arbeitsrecht", "mietrecht",
    // Dokumente
    "schriftsatz", "klageerwiderung", "widerspruch", "einspruch",
    "rechtsanwalt", "notar", "gericht", "vollmacht",
];

const FINANCIAL_KEYWORDS = [
    "aktie", "fonds", "etf", "portfolio", "rendite", "dividende",
    "investition", "anlage", "depot", "börse", "kurs", "wertpapier",
    "kredit", "darlehen", "zinsen", "tilgung", "hypothek",
    "insolvenz", "bilanz", "gewinn", "verlust", "cashflow",
];

const TAX_KEYWORDS = [
    "steuer", "einkommensteuer", "umsatzsteuer", "körperschaftsteuer",
    "steuererklärung", "finanzamt", "steuerbescheid", "abschreibung",
    "vorsteuer", "mehrwertsteuer", "gewerbesteuer", "erbschaftsteuer",
    "steuerberater", "jahresabschluss", "buchführung",
];

// ── Konfidenz-Phrasen (für Konfidenz-Indikator) ───────────────────────────────

export const UNCERTAINTY_PHRASES = [
    "ich bin nicht sicher",
    "ich bin mir nicht sicher",
    "ich glaube",
    "ich denke",
    "möglicherweise",
    "eventuell",
    "könnte sein",
    "es könnte",
    "vielleicht",
    "ich vermute",
    "wahrscheinlich",
    "nicht ganz sicher",
    "bitte überprüf",
    "bitte verifizier",
    "i'm not sure",
    "i think",
    "possibly",
    "might be",
    "could be",
    "perhaps",
];

// ── Hauptfunktion ─────────────────────────────────────────────────────────────

function containsKeywords(text: string, keywords: string[]): boolean {
    const lower = text.toLowerCase();
    return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

export function detectDisclaimer(content: string): DisclaimerResult {
    if (!content || content.length < 20) {
        return { showDisclaimer: false, domain: null, label: "", detail: "" };
    }

    if (containsKeywords(content, MEDICAL_KEYWORDS)) {
        return {
            showDisclaimer: true,
            domain: "medical",
            label: "Medizinischer Hinweis",
            detail: "KI-Ausgaben ersetzen keine ärztliche Diagnose oder Behandlung. Bitte konsultiere einen Arzt.",
        };
    }

    if (containsKeywords(content, LEGAL_KEYWORDS)) {
        return {
            showDisclaimer: true,
            domain: "legal",
            label: "Rechtlicher Hinweis",
            detail: "KI-Ausgaben ersetzen keine Rechtsberatung. Bitte konsultiere einen Rechtsanwalt.",
        };
    }

    if (containsKeywords(content, TAX_KEYWORDS)) {
        return {
            showDisclaimer: true,
            domain: "tax",
            label: "Steuerlicher Hinweis",
            detail: "KI-Ausgaben ersetzen keine Steuerberatung. Bitte konsultiere einen Steuerberater.",
        };
    }

    if (containsKeywords(content, FINANCIAL_KEYWORDS)) {
        return {
            showDisclaimer: true,
            domain: "financial",
            label: "Finanzhinweis",
            detail: "KI-Ausgaben sind keine Anlageberatung. Bitte konsultiere einen Finanzberater.",
        };
    }

    return { showDisclaimer: false, domain: null, label: "", detail: "" };
}

export function detectUncertainty(content: string): boolean {
    if (!content) return false;
    const lower = content.toLowerCase();
    return UNCERTAINTY_PHRASES.some((phrase) => lower.includes(phrase));
}
