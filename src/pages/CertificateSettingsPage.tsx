import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Award, Save } from "lucide-react";

interface CertificateSettings {
  platformName: string;
  instructorName: string;
  instructorTitle: string;
  message: string;
  primaryColor: string;
  logoUrl: string;
}

const DEFAULT_SETTINGS: CertificateSettings = {
  platformName: "Plataforma de Cursos",
  instructorName: "Instrutor",
  instructorTitle: "Instrutor do Curso",
  message: "Por ter concluído com êxito todas as aulas e atividades, demonstrando dedicação e comprometimento com o aprendizado.",
  primaryColor: "#22c55e",
  logoUrl: "",
};

const CertificateSettingsPage = () => {
  const [settings, setSettings] = useState<CertificateSettings>(() => {
    try {
      const saved = localStorage.getItem("certificate_settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const update = (key: keyof CertificateSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem("certificate_settings", JSON.stringify(settings));
    toast.success("Configurações do certificado salvas!");
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("certificate_settings");
    toast.info("Configurações restauradas para o padrão.");
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: settings.primaryColor + "22" }}>
          <Award className="h-5 w-5" style={{ color: settings.primaryColor }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Configurações do Certificado</h1>
          <p className="text-sm text-muted-foreground">Personalize o certificado emitido aos alunos</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="platformName">Nome da Plataforma</Label>
          <Input
            id="platformName"
            value={settings.platformName}
            onChange={(e) => update("platformName", e.target.value)}
            placeholder="Ex: Siege Masterclass"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instructorName">Nome do Instrutor</Label>
            <Input
              id="instructorName"
              value={settings.instructorName}
              onChange={(e) => update("instructorName", e.target.value)}
              placeholder="Ex: Coach Rafael"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructorTitle">Título do Instrutor</Label>
            <Input
              id="instructorTitle"
              value={settings.instructorTitle}
              onChange={(e) => update("instructorTitle", e.target.value)}
              placeholder="Ex: Instrutor Profissional"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Mensagem do Certificado</Label>
          <Textarea
            id="message"
            value={settings.message}
            onChange={(e) => update("message", e.target.value)}
            rows={3}
            placeholder="Texto que aparece abaixo do nome do aluno..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Cor Principal</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="primaryColor"
                value={settings.primaryColor}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="w-10 h-10 rounded-md border border-border cursor-pointer"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="flex-1 font-mono text-sm"
                placeholder="#B8860B"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL da Logo (opcional)</Label>
            <Input
              id="logoUrl"
              value={settings.logoUrl}
              onChange={(e) => update("logoUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Preview swatch */}
        <div className="rounded-lg p-4 border" style={{ borderColor: settings.primaryColor + "44", backgroundColor: settings.primaryColor + "0A" }}>
          <p className="text-xs font-medium mb-1" style={{ color: settings.primaryColor }}>Pré-visualização da cor</p>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.primaryColor }} />
            <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.primaryColor + "66" }} />
            <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.primaryColor + "22" }} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Configurações
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Restaurar Padrão
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CertificateSettingsPage;
