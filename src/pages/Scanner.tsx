import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

export const Scanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { showToast } = useToast();

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          try {
            const data = JSON.parse(decodedText);

            if (data.phoneId) {
              await html5QrCode.stop();
              setScanning(false);
              navigate(`/inventory`);
              showToast('Téléphone trouvé ! Redirection...', 'success');
            } else if (data.imei) {
              const { data: phone, error } = await supabase
                .from('phones')
                .select('id')
                .eq('imei', data.imei)
                .eq('user_id', userId!)
                .maybeSingle();

              if (error) throw error;

              if (phone) {
                await html5QrCode.stop();
                setScanning(false);
                navigate(`/inventory`);
                showToast('Téléphone trouvé !', 'success');
              } else {
                showToast('Téléphone introuvable dans l\'inventaire', 'error');
              }
            }
          } catch (e) {
            showToast('Code QR invalide', 'error');
          }
        },
        () => {
        }
      );

      setScanning(true);
      setError(null);
    } catch (err) {
      setError('Impossible d\'accéder à la caméra. Veuillez autoriser les permissions de caméra.');
      console.error(err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
          Scanner QR
        </h1>
        <p className="text-gray-400">Scannez le code QR d'un téléphone pour voir les détails</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          {!scanning && !error && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Prêt à scanner</h3>
              <p className="text-gray-400 mb-6">
                Cliquez sur le bouton ci-dessous pour commencer à scanner les codes QR
              </p>
              <button
                onClick={startScanning}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 flex items-center gap-2 mx-auto"
              >
                <Camera className="w-5 h-5" />
                Commencer le scan
              </button>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Erreur de caméra</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  startScanning();
                }}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
              >
                Réessayer
              </button>
            </div>
          )}

          {scanning && (
            <div className="space-y-6">
              <div className="relative">
                <div id="qr-reader" className="rounded-xl overflow-hidden" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-violet-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-violet-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-violet-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-violet-500 rounded-br-xl" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-400 mb-4">
                  Positionnez le code QR dans le cadre
                </p>
                <button
                  onClick={stopScanning}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                >
                  Arrêter le scan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
