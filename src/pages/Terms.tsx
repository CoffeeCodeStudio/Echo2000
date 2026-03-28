import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>

        <h1 className="font-display text-2xl font-bold text-foreground mb-6">📜 Användarvillkor — ECHO2000</h1>

        <div className="text-sm text-muted-foreground space-y-4">
          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">1. Allmänt</p>
            <p>ECHO2000 ("tjänsten") drivs av Echo2000-projektet. Genom att skapa ett konto godkänner du dessa villkor i sin helhet. Tjänsten är i Alpha-fas och tillhandahålls utan garantier.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">2. Ålderskrav</p>
            <p>Du måste vara minst <strong>25 år gammal</strong> för att registrera dig och använda tjänsten. Undantag kan göras för yngre användare som bjuds in av verifierade medlemmar.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">3. Uppförande</p>
            <p>Positiv energi är ett krav. Negativitet, personangrepp och delande av personliga problem i publika utrymmen är förbjudet. Måttligt svärande är tillåtet.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">4. Olagligt innehåll</p>
            <p>Alla former av <strong>olagligt innehåll</strong> — inklusive men inte begränsat till hot, trakasserier, hatpropaganda, barnpornografi och upphovsrättsintrång — leder till <strong>omedelbar avstängning och permanent radering</strong> av kontot. Vi förbehåller oss rätten att anmäla till berörda myndigheter.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">5. Innehåll & ansvar</p>
            <p>Du ansvarar för allt innehåll du publicerar. Vi förbehåller oss rätten att ta bort innehåll som bryter mot reglerna utan förvarning. Du behåller rättigheterna till ditt eget innehåll men ger oss en icke-exklusiv rätt att visa det inom tjänsten.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">6. Personuppgifter & GDPR</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Vi sparar nödvändig data (e-postadress, IP-adress, profiluppgifter) för att tjänsten ska fungera.</li>
              <li>Din data delas <strong>inte</strong> med tredje part i marknadsföringssyfte.</li>
              <li>Du kan när som helst begära <strong>radering av ditt konto och all tillhörande data</strong> via inställningarna eller genom att kontakta oss.</li>
              <li>Du har rätt att begära ett utdrag av dina personuppgifter.</li>
              <li>Fullständig integritetspolicy finns på <a href="/regler" className="text-primary hover:underline">Regler & FAQ</a>.</li>
            </ul>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">7. Alpha-status & ansvarsfrihet</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Sidan är under aktiv utveckling. Funktioner kan ändras och data kan återställas <strong>utan förvarning</strong>.</li>
              <li>Vi ansvarar <strong>inte</strong> för tekniska fel, driftstopp eller förlust av data under Alpha-perioden.</li>
              <li>Genom att använda tjänsten accepterar du att den tillhandahålls <strong>"i befintligt skick"</strong> utan garantier.</li>
            </ul>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">8. Konton</p>
            <p>Nya konton kräver godkännande av en administratör. Vi kan stänga av eller radera konton som bryter mot dessa villkor.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">9. AI-karaktärer</p>
            <p>Echo2000 innehåller AI-drivna karaktärer som är tydligt märkta med en <strong>AI-badge</strong> på sin profil. Dessa karaktärer syftar till att hålla communityn aktiv under uppstartsfasen och hjälpa nya användare. De är inte riktiga personer och utger sig inte för att vara det.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">10. Tillämplig lag & tvistlösning</p>
            <p>Dessa villkor regleras av <strong>svensk lag</strong>. Eventuella tvister som uppstår i samband med tjänsten ska i första hand lösas genom dialog. Om överenskommelse inte kan nås ska tvisten avgöras av <strong>svensk allmän domstol</strong>.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">11. Ändringar av villkor</p>
            <p>Vi kan uppdatera dessa villkor. Vid väsentliga ändringar meddelar vi registrerade användare via <strong>e-post eller meddelande i tjänsten</strong> minst 14 dagar innan de nya villkoren träder i kraft. Fortsatt användning av tjänsten efter den perioden innebär att du godkänner de uppdaterade villkoren.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">12. Kontakt</p>
            <p>Frågor om dessa villkor eller dina rättigheter? Kontakta oss på{" "}
              <a href="<a href="mailto:hej@coffeecodestudio.se" className="text-primary hover:underline">hej@coffeecodestudio.se</a>.</a>.
            </p>
          </div>

          <p className="text-xs text-muted-foreground/70 text-center pt-2">
            Senast uppdaterad: mars 2026 · © 2026 Echo2000 Alpha
          </p>
        </div>
      </div>
    </div>
  );
}
