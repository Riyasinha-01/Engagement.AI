import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Sparkles, 
  Send, 
  Eye, 
  Edit3, 
  FileText, 
  Mail,
  AlertCircle
} from 'lucide-react';

import { BACKEND_URL } from '../config';

const EmailEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview' (useful for mobile preview toggle, but we'll show side-by-side on desktop!)

  useEffect(() => {
    fetchEmailTemplate();
  }, [id]);

  const fetchEmailTemplate = async () => {
    try {
      // Fetch details first to populate campaign name
      const campaignResponse = await axios.get(`${BACKEND_URL}/campaigns/${id}`);
      setCampaignName(campaignResponse.data.campaign.campaignName);

      // Generate the template
      setGenerating(true);
      const templateResponse = await axios.post(`${BACKEND_URL}/ai/${id}/email/generate`);
      setSubject(templateResponse.data.subject);
      setBody(templateResponse.data.body);
    } catch (error) {
      console.error('Error fetching email template:', error);
      setErrorMsg('Failed to generate personalized email draft. Please verify insights approval.');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!subject.trim() || !body.trim()) {
      return setErrorMsg('Subject and body content cannot be empty');
    }
    setErrorMsg('');
    setSending(true);

    try {
      await axios.post(`${BACKEND_URL}/campaigns/${id}/send`, { subject, body });
      // Redirect directly to realtime analytics dashboard to watch statuses
      navigate(`/campaigns/${id}/analytics`);
    } catch (error) {
      console.error('Error sending campaign:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to dispatch email campaign.');
    } finally {
      setSending(false);
    }
  };

  // Compile local simulated template values for live preview
  const getSimulatedPreview = (text) => {
    if (!text) return '';
    return text
      .replace(/\{\{name\}\}/g, 'Sophia Miller')
      .replace(/\{\{city\}\}/g, 'Chicago')
      .replace(/\{\{totalOrders\}\}/g, '12')
      .replace(/\{\{totalSpend\}\}/g, '650')
      .replace(/\{\{tracking_link\}\}/g, 'http://localhost:3000/customer/simulated-shopper-id');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 mt-4 font-medium">Drafting personalized shopper copies...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Back Link */}
        <Link 
          to={`/campaigns/${id}/insights`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Review Insights
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-darkBg-border/40">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Mail className="h-7 w-7 text-brand-400" />
              Campaign Copywriter
            </h1>
            <p className="text-gray-400 mt-1">
              Personalized marketing templates generated for campaign <span className="text-white font-semibold">{campaignName}</span>.
            </p>
          </div>

          <button 
            onClick={handleSendCampaign}
            disabled={sending || generating}
            className="btn-premium px-6 py-3 font-semibold text-base"
          >
            {sending ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Dispatching Campaign...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send Campaign
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/45 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Controls (for smaller screens) */}
        <div className="flex md:hidden bg-darkBg-lighter p-1.5 rounded-xl border border-darkBg-border mb-6">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg flex justify-center items-center gap-1.5 transition-all ${activeTab === 'edit' ? 'bg-brand-600 text-white shadow' : 'text-gray-400'}`}
          >
            <Edit3 className="h-4 w-4" />
            Edit Template
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg flex justify-center items-center gap-1.5 transition-all ${activeTab === 'preview' ? 'bg-brand-600 text-white shadow' : 'text-gray-400'}`}
          >
            <Eye className="h-4 w-4" />
            Live Preview
          </button>
        </div>

        {/* Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Editing Area */}
          <div className={`space-y-6 ${activeTab === 'edit' ? 'block' : 'hidden lg:block'}`}>
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-darkBg-border/40">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Edit3 className="h-4.5 w-4.5 text-brand-400" />
                  Editor
                </h3>
                <span className="text-xs text-gray-500 font-medium">Auto-saved Draft</span>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject Template</label>
                  <input 
                    type="text"
                    className="block w-full px-4 py-3 bg-darkBg border border-darkBg-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-sans font-medium"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject line..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Body Template</label>
                  <textarea 
                    rows={12}
                    className="block w-full px-4 py-3 bg-darkBg border border-darkBg-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono text-sm leading-relaxed"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Compose marketing copy..."
                  />
                </div>

                {/* Placeholders Guide */}
                <div className="p-4 bg-darkBg-lighter/60 border border-darkBg-border rounded-xl">
                  <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-2">Available Substitution Variables</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-400">
                    <div><span className="text-gray-200">{"{{name}}"}</span> - Shopper Name</div>
                    <div><span className="text-gray-200">{"{{city}}"}</span> - Shopper City</div>
                    <div><span className="text-gray-200">{"{{totalOrders}}"}</span> - Order count</div>
                    <div><span className="text-gray-200">{"{{totalSpend}}"}</span> - Spending sum</div>
                    <div className="col-span-2 text-amber-400 mt-1 font-semibold"><span className="text-amber-300">{"{{tracking_link}}"}</span> - Engagement Link (Required)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Preview Screen */}
          <div className={`space-y-6 ${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
            <div className="glass-panel p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-darkBg-border/40">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Eye className="h-4.5 w-4.5 text-emerald-400" />
                  Live Customer Preview
                </h3>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-semibold">Simulated Recipient</span>
              </div>

              {/* Email Envelope Container */}
              <div className="bg-white text-gray-800 rounded-xl overflow-hidden shadow-inner flex-1 flex flex-col min-h-[380px]">
                {/* Envelope header */}
                <div className="bg-gray-100 p-4 border-b border-gray-200 text-xs text-gray-500 space-y-1.5 font-sans">
                  <div><span className="font-semibold text-gray-400">From:</span> marketing@yourbrand.com</div>
                  <div><span className="font-semibold text-gray-400">To:</span> sophia.miller@example.com (Sophia Miller, Chicago)</div>
                  <div className="text-sm font-bold text-gray-900 mt-1 select-none">
                    <span className="font-semibold text-gray-400 text-xs mr-1">Subject:</span> {getSimulatedPreview(subject) || '(Empty Subject)'}
                  </div>
                </div>
                
                {/* Envelope Body */}
                <div className="p-6 bg-white overflow-y-auto font-sans text-sm text-gray-700 leading-relaxed flex-1 select-text whitespace-pre-wrap">
                  {getSimulatedPreview(body) || 'Draft your email body in the editor to preview customer copy...'}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center italic">
                All templates variables are automatically interpolated before delivery is dispatched.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default EmailEditor;
