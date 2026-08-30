import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

interface BulkImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

interface ParsedPhone {
  model: string;
  storage: string;
  color: string;
  imei: string;
  purchase_price: number;
  purchase_date: string;
  notes: string;
  error?: string;
}

const TEMPLATE = `Modele,Stockage,Couleur,IMEI,Prix,Date,Notes
iPhone 13,128GB,Noir,123456789012345,250,2026-07-24,Batterie 85%
iPhone 14 Pro,256GB,Violet,987654321098765,420,2026-07-24,`;

export default function BulkImportModal({ onClose, onImported }: BulkImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [parsedPhones, setParsedPhones] = useState<ParsedPhone[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [importing, setImporting] = useState(false);

  const { userId } = useAuth();
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  const parseCSV = (text: string): ParsedPhone[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return [];

    // Détecte et ignore la ligne d'en-tête si présente
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('model') || firstLine.includes('modele') || firstLine.includes('imei');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      const [model = '', storage = '', color = '', imei = '', priceRaw = '', dateRaw = '', notes = ''] = cols;

      const price = parseFloat(priceRaw.replace(',', '.'));
      const date = dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : today;

      let error: string | undefined;
      if (!model) error = 'Modèle manquant';
      else if (!imei) error = 'IMEI manquant';
      else if (isNaN(price) || price <= 0) error = 'Prix invalide';

      return {
        model,
        storage: storage || '128GB',
        color: color || 'Non spécifié',
        imei,
        purchase_price: isNaN(price) ? 0 : price,
        purchase_date: date,
        notes,
        error,
      };
    });
  };

  const handlePreview = () => {
    const parsed = parseCSV(rawText);
    if (parsed.length === 0) {
      showToast('Aucune donnée détectée', 'error');
      return;
    }
    setParsedPhones(parsed);
    setStep('preview');
  };

  const validCount = parsedPhones.filter((p) => !p.error).length;
  const errorCount = parsedPhones.filter((p) => p.error).length;

  const handleImport = async () => {
    const validPhones = parsedPhones.filter((p) => !p.error);
    if (validPhones.length === 0) {
      showToast('Aucun téléphone valide à importer', 'error');
      return;
    }

    setImporting(true);
    try {
      const rows = validPhones.map((p) => ({
        model: p.model,
        storage: p.storage,
        color: p.color,
        imei: p.imei,
        purchase_price: p.purchase_price,
        purchase_date: p.purchase_date,
        notes: p.notes,
        condition: 'Non spécifié',
        is_sold: false,
        user_id: userId!,
      }));

      const { error } = await supabase.from('phones').insert(rows);
      if (error) throw error;

      showToast(`${rows.length} téléphone(s) importé(s) avec succès`, 'success');
      onImported();
      onClose();
    } catch (error: any) {
      showToast(error.message || "Erreur lors de l'import", 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto
      bg-neutral-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-neutral-900/40 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent flex items-center gap-2">
            <Upload className="w-6 h-6 text-violet-400" />
            Importer des téléphones
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {step === 'input' && (
            <>
              <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl space-y-2">
                <p className="text-sm text-gray-300">
                  Colle une liste de téléphones au format <strong>CSV</strong> (une ligne par téléphone, séparée par des virgules) :
                </p>
                <p className="text-xs text-gray-500">
                  Modèle, Stockage, Couleur, IMEI, Prix, Date (AAAA-MM-JJ), Notes
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-1 block">Données à importer</label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                  text-white placeholder-gray-500 font-mono text-sm resize-none focus:ring-2 focus:ring-violet-500/40"
                  placeholder={TEMPLATE}
                />
              </div>

              <button
                type="button"
                onClick={() => setRawText(TEMPLATE)}
                className="text-xs text-violet-400 hover:text-violet-300 transition"
              >
                Insérer un exemple de modèle
              </button>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={!rawText.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white
                  bg-gradient-to-r from-violet-600 to-fuchsia-600
                  hover:from-violet-500 hover:to-fuchsia-500 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prévisualiser
                </button>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">{validCount} valide(s)</span>
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">{errorCount} erreur(s) (ignoré(s))</span>
                  </div>
                )}
              </div>

              <div className="border border-white/10 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-400 font-medium">Modèle</th>
                        <th className="text-left px-3 py-2 text-gray-400 font-medium">Stockage</th>
                        <th className="text-left px-3 py-2 text-gray-400 font-medium">Couleur</th>
                        <th className="text-left px-3 py-2 text-gray-400 font-medium">IMEI</th>
                        <th className="text-left px-3 py-2 text-gray-400 font-medium">Prix</th>
                        <th className="text-left px-3 py-2 text-gray-400 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedPhones.map((phone, i) => (
                        <tr
                          key={i}
                          className={`border-t border-white/5 ${phone.error ? 'bg-red-500/5' : ''}`}
                        >
                          <td className="px-3 py-2 text-white">
                            {phone.model || <span className="text-red-400 italic">manquant</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-300">{phone.storage}</td>
                          <td className="px-3 py-2 text-gray-300">{phone.color}</td>
                          <td className="px-3 py-2 text-gray-300 font-mono text-xs">
                            {phone.imei || <span className="text-red-400 italic">manquant</span>}
                          </td>
                          <td className="px-3 py-2 text-white">
                            {phone.error ? (
                              <span className="text-red-400 text-xs">{phone.error}</span>
                            ) : (
                              `${phone.purchase_price}€`
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-300">{phone.purchase_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white transition"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white
                  bg-gradient-to-r from-violet-600 to-fuchsia-600
                  hover:from-violet-500 hover:to-fuchsia-500 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    `Importer ${validCount} téléphone(s)`
                  )}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
