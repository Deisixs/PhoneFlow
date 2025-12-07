import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

interface Repair {
  id: string;
  phone_id: string;
  description: string;
  repair_list: string;
  cost: number;
  status: string;
  technician: string | null;
  photo_url: string | null;
}

interface Phone {
  id: string;
  model: string;
  imei: string;
}

interface RepairModalProps {
  repair: Repair | null;
  phones: Phone[];
  onClose: () => void;
  onSave: () => void;
}

export const RepairModal: React.FC<RepairModalProps> = ({ repair, phones, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    phone_id: repair?.phone_id || '',
    description: repair?.description || '',
    repair_list: repair?.repair_list || '',
    cost: repair?.cost || 0,
    status: repair?.status || 'pending',
    technician: repair?.technician || '',
    photo_url: repair?.photo_url || '',
  });
  const [loading, setLoading] = useState(false);
  const { userId } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const repairData = {
        ...formData,
        user_id: userId!,
        technician: formData.technician || null,
        photo_url: formData.photo_url || null,
      };

      if (repair?.id) {
        const { error } = await supabase
          .from('repairs')
          .update(repairData)
          .eq('id', repair.id);

        if (error) throw error;
        showToast('Repair updated successfully', 'success');
      } else {
        const { error } = await supabase.from('repairs').insert(repairData);

        if (error) throw error;
        showToast('Repair added successfully', 'success');
      }

      onSave();
    } catch (error: any) {
      showToast(error.message || 'Failed to save repair', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {repair ? 'Edit Repair' : 'Add New Repair'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <select
              value={formData.phone_id}
              onChange={(e) => setFormData({ ...formData, phone_id: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="" className="bg-gray-900">Select a phone</option>
              {phones.map((phone) => (
                <option key={phone.id} value={phone.id} className="bg-gray-900">
                  {phone.model} - {phone.imei}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              placeholder="Screen replacement, battery swap, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Repair Details</label>
            <textarea
              value={formData.repair_list}
              onChange={(e) => setFormData({ ...formData, repair_list: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
              placeholder="List all repairs performed..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cost (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="pending" className="bg-gray-900">Pending</option>
                <option value="in_progress" className="bg-gray-900">In Progress</option>
                <option value="completed" className="bg-gray-900">Completed</option>
                <option value="failed" className="bg-gray-900">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Technician (Optional)</label>
              <input
                type="text"
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Photo URL (Optional)</label>
              <input
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Repair'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
