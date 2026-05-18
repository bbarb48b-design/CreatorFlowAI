import { GoogleGenAI, Type } from "@google/genai";

const AI_MODEL = "gemini-1.5-flash"; // Using flash for speed

interface AIResponse {
  content: string;
}

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generatePlan(topic: string, userContext?: string) {
    return this.generate({
      systemInstruction: `Vi ste Kreativni AI asistent za digitalne kreatore. 
      Vaš cilj je pomoći planerima identificirati profitabilne niše i specifične teme videozapisa.
      Nadogradite korisnikove početne misli ako postoje. Sav odgovor mora biti na HRVATSKOM jeziku.`,
      prompt: `Tema: "${topic}". 
      Korisnikovi unosi: "${userContext || 'Nema.'}".
      Pružite plan sadržaja (niša, publika, scenarij, storyboard).`
    });
  }

  async generateProduction(plan: string, userContext?: string) {
    return this.generate({
      systemInstruction: `Vi ste Kreativni AI asistent za produkciju. Generirajte vizualne upute i prijedloge glasova. Sav odgovor mora biti na HRVATSKOM jeziku.`,
      prompt: `Plan: "${plan}". Korisnikove želje: "${userContext || 'Nema.'}". 
      Generirajte 3 vizualne upute i stil AI glasa.`
    });
  }

  async generateEditingAdvice(projectContext: string, userContext?: string, advancedOptions?: { transitions?: string; effects?: string; timestamps?: string }) {
    const adv = advancedOptions ? `
      TEHNIČKI ZAHTJEVI:
      - Prijelazi: ${advancedOptions.transitions || 'Standardni'}
      - Efekti: ${advancedOptions.effects || 'Standardni'}
      - Vremenski kodovi: ${advancedOptions.timestamps || 'Nije specificirano'}
    ` : '';

    return this.generate({
      systemInstruction: `Vi ste Kreativni AI asistent za uređivanje videa. 
      Vaš cilj je pružiti konkretne upute za montažu, uključujući rad s prijelazima, efektima i preciznim rezovima.
      Sav odgovor mora biti na HRVATSKOM jeziku.`,
      prompt: `Projekt: "${projectContext}". 
      Korisnikove ideje: "${userContext || 'Nema.'}".
      ${adv}
      Pružite detaljne upute za montažu, prijedloge za implementaciju odabranih efekata i plan za rezanje videa na temelju vremenskih kodova ako su navedeni.`
    });
  }

  async generatePublishing(contentSummary: string, userContext?: string) {
    return this.generate({
      systemInstruction: `Vi ste Kreativni AI asistent za objavljivanje. Generirajte naslove i savjete za pristupačnost. Sav odgovor mora biti na HRVATSKOM jeziku.`,
      prompt: `Sadržaj: "${contentSummary}". Korisnikove napomene: "${userContext || 'Nema.'}". 
      Pružite 5 naslova i vodič za pristupačnost.`
    });
  }

  async generateAvatarAdvice(brandingContext: string, userContext?: string) {
    return this.generate({
      systemInstruction: `Vi ste stručnjak za AI avatare. Pomozite razviti digitalni lik. Sav odgovor mora biti na HRVATSKOM jeziku.`,
      prompt: `Brend: "${brandingContext}". Korisnikove želje: "${userContext || 'Nema.'}". 
      Pružite prijedloge arhetipa, upute i savjete za animaciju.`
    });
  }

  async analyzeBranding(history: string, userContext?: string) {
    return this.generate({
      systemInstruction: `Vi ste stručnjak za brendiranje. Analizirajte stil i dajte savjete. Sav odgovor mora biti na HRVATSKOM jeziku.`,
      prompt: `Povijest: "${history}". Korisnikovi dodaci: "${userContext || 'Nema.'}". 
      Pružite analizu, korake za poboljšanje i vizualni stil.`
    });
  }

  private async generate({ systemInstruction, prompt }: { systemInstruction: string; prompt: string }) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction,
        }
      });
      return response.text || "";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
