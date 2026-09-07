import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Search,
  Trash2,
  FlaskConical,
  Cpu,
  Code2,
  Wrench,
  Activity,
} from 'lucide-react';

// ============================================================================
// BASE DE MODÈLES — mapping "identifiant produit" -> nom commercial + famille
// ============================================================================
const DEVICE_MODELS: Record<string, { name: string; family: string }> = {
  'iPhone10,3': { name: 'iPhone X', family: 'iPhone X' },
  'iPhone10,6': { name: 'iPhone X', family: 'iPhone X' },
  'iPhone11,2': { name: 'iPhone XS', family: 'iPhone XS / XS Max' },
  'iPhone11,4': { name: 'iPhone XS Max', family: 'iPhone XS / XS Max' },
  'iPhone11,6': { name: 'iPhone XS Max', family: 'iPhone XS / XS Max' },
  'iPhone11,8': { name: 'iPhone XR', family: 'iPhone XR' },
  'iPhone12,1': { name: 'iPhone 11', family: 'iPhone 11 / 11 Pro / 11 Pro Max' },
  'iPhone12,3': { name: 'iPhone 11 Pro', family: 'iPhone 11 / 11 Pro / 11 Pro Max' },
  'iPhone12,5': { name: 'iPhone 11 Pro Max', family: 'iPhone 11 / 11 Pro / 11 Pro Max' },
  'iPhone12,8': { name: 'iPhone SE (2e gen)', family: 'iPhone SE 2020' },
  'iPhone13,1': { name: 'iPhone 12 mini', family: 'iPhone 12 / 12 mini / 12 Pro / 12 Pro Max' },
  'iPhone13,2': { name: 'iPhone 12', family: 'iPhone 12 / 12 mini / 12 Pro / 12 Pro Max' },
  'iPhone13,3': { name: 'iPhone 12 Pro', family: 'iPhone 12 / 12 mini / 12 Pro / 12 Pro Max' },
  'iPhone13,4': { name: 'iPhone 12 Pro Max', family: 'iPhone 12 / 12 mini / 12 Pro / 12 Pro Max' },
  'iPhone14,4': { name: 'iPhone 13 mini', family: 'iPhone 13 / 13 mini / 13 Pro / 13 Pro Max' },
  'iPhone14,5': { name: 'iPhone 13', family: 'iPhone 13 / 13 mini / 13 Pro / 13 Pro Max' },
  'iPhone14,2': { name: 'iPhone 13 Pro', family: 'iPhone 13 / 13 mini / 13 Pro / 13 Pro Max' },
  'iPhone14,3': { name: 'iPhone 13 Pro Max', family: 'iPhone 13 / 13 mini / 13 Pro / 13 Pro Max' },
  'iPhone14,6': { name: 'iPhone SE (3e gen)', family: 'iPhone SE 2022' },
  'iPhone14,7': { name: 'iPhone 14', family: 'iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max' },
  'iPhone14,8': { name: 'iPhone 14 Plus', family: 'iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max' },
  'iPhone15,2': { name: 'iPhone 14 Pro', family: 'iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max' },
  'iPhone15,3': { name: 'iPhone 14 Pro Max', family: 'iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max' },
  'iPhone15,4': { name: 'iPhone 15', family: 'iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max' },
  'iPhone15,5': { name: 'iPhone 15 Plus', family: 'iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max' },
  'iPhone16,1': { name: 'iPhone 15 Pro', family: 'iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max' },
  'iPhone16,2': { name: 'iPhone 15 Pro Max', family: 'iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max' },
  'iPhone17,1': { name: 'iPhone 16 Pro', family: 'iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max' },
  'iPhone17,2': { name: 'iPhone 16 Pro Max', family: 'iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max' },
  'iPhone17,3': { name: 'iPhone 16', family: 'iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max' },
  'iPhone17,4': { name: 'iPhone 16 Plus', family: 'iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max' },
};

// ============================================================================
// BASE DE DIAGNOSTIC — pistes heuristiques basées sur des mots-clés connus
// dans la communauté repair (Tristar/Hydra, SMC, NAND, etc.)
// ⚠️ Ce n'est PAS une base officielle Apple : ce sont des pistes de départ,
// à affiner toi-même avec ton expérience terrain (tu peux éditer ce tableau
// librement pour y ajouter tes propres correspondances au fil du temps).
// ============================================================================
interface DiagnosticRule {
  match: RegExp;
  label: string;
  title: string;
  whatToCheck: string;
  part: string;
}

const DIAGNOSTIC_RULES: DiagnosticRule[] = [
  {
    match: /smc panic/i,
    label: 'SMC PANIC',
    title: 'Souci lié au System Management Controller (alimentation)',
    whatToCheck: 'Vérifier la nappe et le connecteur du port de charge, ainsi que les IC Tristar/Hydra sur la carte mère.',
    part: 'Nappe port de charge / IC de charge (Tristar-Hydra)',
  },
  {
    match: /sensor array|loss of sensors/i,
    label: 'Sensor Array',
    title: 'Perte de communication avec un capteur (souvent lié au port de charge)',
    whatToCheck: "La nappe est-elle bien branchée ? Est-elle déchirée ou oxydée ?",
    part: 'Nappe port de charge',
  },
  {
    match: /backlight/i,
    label: 'Backlight',
    title: "Problème de rétroéclairage écran",
    whatToCheck: "Tester avec un écran de remplacement pour confirmer si le souci vient de l'écran ou de la carte mère.",
    part: "Écran (ou circuit backlight sur carte mère si le nouvel écran ne résout rien)",
  },
  {
    match: /nand|flash storage/i,
    label: 'NAND / Stockage',
    title: 'Erreur liée à la puce de stockage NAND',
    whatToCheck: 'Souvent une panne de carte mère (puce NAND soudée), rarement réparable sans matériel de micro-soudure.',
    part: 'Carte mère (puce NAND) — réparation avancée',
  },
  {
    match: /gasgauge|battery/i,
    label: 'Battery / GasGauge',
    title: 'Problème de gestion ou de communication batterie',
    whatToCheck: "Vérifier l'état de la batterie et sa connexion. Tester avec une batterie neuve.",
    part: 'Batterie',
  },
  {
    match: /baseband|modem/i,
    label: 'Baseband / Modem',
    title: 'Problème lié au modem cellulaire',
    whatToCheck: 'Vérifier les antennes et connecteurs RF. Souvent lié à un dégât liquide ou une puce de carte mère.',
    part: 'Antennes RF / Carte mère (baseband)',
  },
  {
    match: /wifi|bluetooth|bcm4/i,
    label: 'WiFi / Bluetooth',
    title: 'Problème du module WiFi/Bluetooth',
    whatToCheck: 'Vérifier l\'antenne WiFi/Bluetooth et sa nappe de connexion.',
    part: 'Nappe antenne WiFi/Bluetooth',
  },
  {
    match: /camera|isp /i,
    label: 'Caméra',
    title: 'Problème lié à un module caméra',
    whatToCheck: 'Tester avec un module caméra de remplacement pour confirmer.',
    part: 'Module caméra (avant ou arrière selon le contexte)',
  },
  {
    match: /multitouch|touch controller/i,
    label: 'Touch / Digitizer',
    title: 'Problème du contrôleur tactile',
    whatToCheck: 'Vérifier la nappe écran et le connecteur digitizer.',
    part: 'Écran / Nappe digitizer',
  },
  {
    match: /audio|codec/i,
    label: 'Audio',
    title: 'Problème du circuit audio',
    whatToCheck: 'Tester haut-parleur, micro et nappe audio.',
    part: 'Nappe audio / Haut-parleur',
  },
];

interface ParsedResult {
  product: string | null;
  osVersion: string | null;
  panicString: string;
  codes: string[];
}

const SAMPLE_LOG = `{"bug_type":"210","timestamp":"2026-02-20 14:32:11.00 +0100","os_version":"iPhone OS 17.3 (21D50)","incident_id":"A1B2C3D4-E5F6-7890-ABCD-EF1234567890"}
{
  "build" : "iPhone OS 17.3 (21D50)",
  "product" : "iPhone14,5",
  "kernel" : "Darwin Kernel Version 23.3.0",
  "incident" : "A1B2C3D4-E5F6-7890-ABCD-EF1234567890",
  "crashReporterKey" : "abcdef1234567890abcdef1234567890abcdef12",
  "date" : "2026-02-20 14:32:11.32 +0100",
  "panicString" : "SMC PANIC - Loss of sensors - ASSERTION FAILED: Sensor Array 0x800 at (/BuildRoot/Library/Caches/com.apple.xbs/Sources/SMCFirmware/SMCFirmware-2.30.2/common/smc_sensor.c:629)\\nPlease inspect the panic log for more details.",
}`;

function parsePanicLog(raw: string): ParsedResult {
  const productMatch = raw.match(/"product"\s*:\s*"([^"]+)"/);
  const osVersionMatch = raw.match(/"os_version"\s*:\s*"([^"]+)"/) || raw.match(/"build"\s*:\s*"([^"]+)"/);
  const panicStringMatch = raw.match(/"panicString"\s*:\s*"([\s\S]*?)"\s*[,}]/);

  const panicStringRaw = panicStringMatch ? panicStringMatch[1] : '';
  const panicString = panicStringRaw.replace(/\\n/g, ' ').replace(/\\"/g, '"');

  const codes = Array.from(new Set((raw.match(/0x[0-9a-fA-F]{2,}/g) || [])));

  return {
    product: productMatch ? productMatch[1] : null,
    osVersion: osVersionMatch ? osVersionMatch[1] : null,
    panicString,
    codes,
  };
}

export default function PanicPro() {
  const navigate = useNavigate();
  const [rawLog, setRawLog] = useState('');
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = () => {
    if (!rawLog.trim()) return;
    try {
      const parsed = parsePanicLog(rawLog);
      if (!parsed.product && !parsed.panicString) {
        setError("Impossible d'extraire des informations de ce fichier. Vérifie que c'est bien un panic log iPhone (.ips).");
        setResult(null);
        return;
      }
      setError(null);
      setResult(parsed);
    } catch {
      setError("Erreur lors de l'analyse du fichier.");
      setResult(null);
    }
  };

  const handleClear = () => {
    setRawLog('');
    setResult(null);
    setError(null);
  };

  const handleExample = () => {
    setRawLog(SAMPLE_LOG);
    setResult(null);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleAnalyze();
    }
  };

  const deviceInfo = result?.product ? DEVICE_MODELS[result.product] : null;

  const matchedDiagnostics = result
    ? DIAGNOSTIC_RULES.filter((rule) => rule.match.test(result.panicString))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/outils')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux outils
      </button>

      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <AlertTriangle className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">PanicPro</h1>
          <p className="text-gray-400 mt-1">Analyseur de Panic Full iPhone</p>
        </div>
      </div>

      {/* Zone de saisie style terminal */}
      <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-gray-500 font-mono ml-2">panic_full.ips</span>
        </div>
        <textarea
          value={rawLog}
          onChange={(e) => setRawLog(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={12}
          placeholder={`Colle ici le contenu du fichier panic full iPhone...\n\n(Ctrl+Entrée pour analyser)`}
          className="w-full p-4 bg-transparent text-gray-300 placeholder-gray-600 font-mono text-sm resize-none focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAnalyze}
          disabled={!rawLog.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-xl font-semibold hover:bg-violet-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Search className="w-4 h-4" />
          Analyser
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl font-semibold hover:bg-white/10 transition"
        >
          <Trash2 className="w-4 h-4" />
          Effacer
        </button>
        <button
          onClick={handleExample}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl font-semibold hover:bg-white/10 transition"
        >
          <FlaskConical className="w-4 h-4" />
          Exemple
        </button>
      </div>

      {error && (
        <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!result && !error && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
          <Activity className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Colle un panic full iPhone pour détecter les pannes matérielles</p>
          <p className="text-xs text-gray-600 mt-1">Compatible iPhone X → iPhone 16 Pro Max</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Appareil détecté */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4" />
              Appareil détecté
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500 w-20 shrink-0">Modèle</span>
                <span className="text-white font-semibold">
                  {deviceInfo ? deviceInfo.name : result.product || 'Non détecté'}
                  {result.product && <span className="text-gray-500 font-normal"> ({result.product})</span>}
                </span>
              </div>
              {deviceInfo && (
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20 shrink-0">Famille</span>
                  <span className="text-gray-300">{deviceInfo.family}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-gray-500 w-20 shrink-0">iOS</span>
                <span className="text-gray-300">{result.osVersion || 'Non détecté'}</span>
              </div>
            </div>
          </div>

          {/* Codes détectés */}
          {result.codes.length > 0 && (
            <div className="backdrop-blur-xl bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Code2 className="w-4 h-4" />
                Codes détectés
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.codes.map((code) => (
                  <span
                    key={code}
                    className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm font-mono"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wide flex items-center gap-2 mb-4">
              <Wrench className="w-4 h-4" />
              Diagnostic
            </h3>

            {matchedDiagnostics.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Aucune piste connue trouvée pour ce panic log. Le texte brut ci-dessous peut t'aider à investiguer manuellement.
              </p>
            ) : (
              <div className="space-y-4">
                {matchedDiagnostics.map((diag, i) => (
                  <div key={i} className="pb-4 border-b border-white/5 last:border-b-0 last:pb-0">
                    <span className="inline-block px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-xs font-mono mb-2">
                      {diag.label}
                    </span>
                    <p className="text-white font-semibold text-sm mb-2">{diag.title}</p>
                    <p className="text-xs text-gray-400 mb-1">
                      <span className="text-gray-500">Quoi vérifier : </span>
                      {diag.whatToCheck}
                    </p>
                    <p className="text-xs">
                      <span className="text-gray-500">Piste pièce : </span>
                      <span className="text-emerald-400 font-semibold">{diag.part}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                Voir le texte brut du panic
              </summary>
              <p className="text-xs text-gray-400 font-mono mt-2 leading-relaxed break-words">
                {result.panicString || 'Non disponible'}
              </p>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}