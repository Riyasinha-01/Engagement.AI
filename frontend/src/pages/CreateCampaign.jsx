import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Sparkles, FolderPlus } from 'lucide-react';

import { BACKEND_URL } from '../config';

const CreateCampaign = () => {
  const [campaignName, setCampaignName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      return setErrorMsg('Campaign name is required');
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/campaigns`, { campaignName });
      const newCampaign = response.data;
      // Redirect to campaign detail / upload workspace
      navigate(`/campaigns/${newCampaign._id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Blur glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-brand-500/10 blur-[100px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="glass-panel p-8 relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="p-3.5 bg-brand-600/10 border border-brand-500/20 text-brand-400 rounded-2xl mb-4">
              <FolderPlus className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Create New Campaign</h2>
            <p className="text-sm text-gray-400 mt-1">Initiate a shopper engagement experience.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-950/45 border border-red-500/30 rounded-xl text-red-200 text-sm text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="campaignName">
                Campaign Name
              </label>
              <input
                id="campaignName"
                type="text"
                required
                className="block w-full px-4 py-3 bg-darkBg/60 border border-darkBg-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                placeholder="e.g. Summer Sale 2026"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                maxLength={50}
              />
              <p className="mt-2.5 text-xs text-gray-400 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-brand-400" />
                This automatically generates a unique tracking Campaign ID (e.g. CMP001).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-premium py-3 text-base flex justify-center items-center"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Create & Continue'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
