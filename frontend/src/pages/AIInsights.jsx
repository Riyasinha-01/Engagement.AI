import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Sparkles, 
  ThumbsUp, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  Award,
  Users,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

import { BACKEND_URL } from '../config';

const AIInsights = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/campaigns/${id}`);
      setCampaign(response.data.campaign);
      setCustomers(response.data.customers || []);
      setInsight(response.data.aiInsight);
    } catch (error) {
      console.error('Error fetching campaign insights:', error);
      setErrorMsg('Failed to load audience insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setErrorMsg('');
    setApproving(true);
    try {
      await axios.post(`${BACKEND_URL}/ai/${id}/approve`);
      // Navigate to email editor to compose the campaign
      navigate(`/campaigns/${id}/email-editor`);
    } catch (error) {
      console.error('Error approving campaign:', error);
      setErrorMsg(error.response?.data?.message || 'Approval request failed.');
      setApproving(false);
    }
  };

  const handleRegenerate = async () => {
    setErrorMsg('');
    setRegenerating(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/ai/${id}/regenerate`);
      setInsight(response.data);
    } catch (error) {
      console.error('Error regenerating campaign:', error);
      setErrorMsg(error.response?.data?.message || 'Regeneration request failed.');
    } finally {
      setRegenerating(false);
    }
  };

  // Map Customer IDs back to actual Customer objects for display
  const getCategorizedCustomers = (idsArray) => {
    if (!idsArray || !Array.isArray(idsArray)) return [];
    return customers.filter(c => idsArray.includes(c._id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 mt-4 font-medium">Extracting audience demographics...</p>
      </div>
    );
  }

  const highValueList = getCategorizedCustomers(insight?.highValueCustomers);
  const likelyToRepurchaseList = getCategorizedCustomers(insight?.likelyToRepurchase);
  const atRiskList = getCategorizedCustomers(insight?.atRiskCustomers);
  const recommendation = insight?.recommendedCampaign;

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Back navigation */}
        <Link 
          to={`/campaigns/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Campaign Details
        </Link>

        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-darkBg-border/40">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-brand-400 fill-brand-400" />
              Audience AI Insights
            </h1>
            <p className="text-gray-400 mt-1">
              AI-driven segmentation and recommended engagement models for <span className="text-white font-semibold">{campaign?.campaignName}</span>.
            </p>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleRegenerate}
              disabled={regenerating || approving}
              className="btn-secondary px-5"
            >
              <RefreshCw className={`h-4.5 w-4.5 text-brand-400 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
            <button 
              onClick={handleApprove}
              disabled={approving || regenerating || !recommendation}
              className="btn-premium px-6 font-semibold"
            >
              {approving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Approving Strategy...
                </>
              ) : (
                <>
                  <ThumbsUp className="h-4.5 w-4.5" />
                  Approve Campaign
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 bg-red-950/45 border border-red-500/30 rounded-xl text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {/* AI Insight Dashboards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Categorizations Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              Audience Classifications
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* High Value */}
              <div className="glass-panel p-5 flex flex-col h-[280px]">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <Award className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">High Value</h3>
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 mb-1">{highValueList.length}</div>
                <p className="text-xs text-gray-400 mb-4">Top spending shoppers with healthy transaction counts.</p>
                <div className="flex-1 overflow-y-auto space-y-2 border-t border-darkBg-border/30 pt-3">
                  {highValueList.map(c => (
                    <div key={c._id} className="text-xs flex justify-between items-center text-gray-300">
                      <span className="truncate pr-2">{c.name}</span>
                      <span className="text-emerald-400 font-medium font-mono">${c.totalSpend}</span>
                    </div>
                  ))}
                  {highValueList.length === 0 && <span className="text-xs text-gray-500 italic">No customers found</span>}
                </div>
              </div>

              {/* Likely to Repurchase */}
              <div className="glass-panel p-5 flex flex-col h-[280px]">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">Likely Repurchase</h3>
                </div>
                <div className="text-2xl font-extrabold text-blue-400 mb-1">{likelyToRepurchaseList.length}</div>
                <p className="text-xs text-gray-400 mb-4">Frequent buyers or customers with recent order actions.</p>
                <div className="flex-1 overflow-y-auto space-y-2 border-t border-darkBg-border/30 pt-3">
                  {likelyToRepurchaseList.map(c => (
                    <div key={c._id} className="text-xs flex justify-between items-center text-gray-300">
                      <span className="truncate pr-2">{c.name}</span>
                      <span className="text-blue-400 font-semibold font-mono">{c.totalOrders} ords</span>
                    </div>
                  ))}
                  {likelyToRepurchaseList.length === 0 && <span className="text-xs text-gray-500 italic">No customers found</span>}
                </div>
              </div>

              {/* At Risk */}
              <div className="glass-panel p-5 flex flex-col h-[280px]">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">At Risk</h3>
                </div>
                <div className="text-2xl font-extrabold text-red-400 mb-1">{atRiskList.length}</div>
                <p className="text-xs text-gray-400 mb-4">Low conversion counts or long periods since last purchase.</p>
                <div className="flex-1 overflow-y-auto space-y-2 border-t border-darkBg-border/30 pt-3">
                  {atRiskList.map(c => (
                    <div key={c._id} className="text-xs flex justify-between items-center text-gray-300">
                      <span className="truncate pr-2">{c.name}</span>
                      <span className="text-red-400 font-semibold font-mono">{c.lastOrders}d ago</span>
                    </div>
                  ))}
                  {atRiskList.length === 0 && <span className="text-xs text-gray-500 italic">No customers found</span>}
                </div>
              </div>

            </div>
          </div>

          {/* Recommendation Campaign Card */}
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gray-400" />
              Proposed AI Strategy
            </h2>

            <div className="glass-panel p-6 border-brand-500/30 flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-darkBg-card to-brand-950/20">
              <div className="absolute top-0 right-0 p-3 bg-brand-500/10 border-l border-b border-brand-500/20 text-brand-400 text-xs font-bold rounded-bl-xl uppercase tracking-wider">Recommended</div>
              
              <div className="space-y-6 flex-1 mt-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-1">Campaign Title</h4>
                  <p className="text-xl font-bold text-white">{recommendation?.title || 'Drafting Title...'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-1">Proposed Offer</h4>
                  <p className="text-lg font-extrabold text-amber-400 font-sans">{recommendation?.offer || 'Drafting Offer...'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-1">Audience Rationale</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{recommendation?.reason || 'Synthesizing data profiles...'}</p>
                </div>
              </div>

              <div className="mt-8 border-t border-darkBg-border/40 pt-4">
                <button
                  onClick={handleApprove}
                  disabled={approving || regenerating || !recommendation}
                  className="w-full btn-premium py-3 font-semibold flex items-center justify-center gap-2"
                >
                  Approve Campaign & Draft Copy
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AIInsights;
