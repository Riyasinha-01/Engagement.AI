import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Plus, 
  LogOut, 
  BarChart3, 
  Layers, 
  Zap, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  Send 
} from 'lucide-react';

import { BACKEND_URL } from '../config';

const Dashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/campaigns`);
      setCampaigns(response.data.campaigns);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setErrorMsg('Failed to load campaigns. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-600/20 text-gray-400 border border-gray-500/20">Draft</span>;
      case 'ANALYZED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Analyzed</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Approved</span>;
      case 'SENT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1"><Send className="h-3 w-3" /> Sending</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Completed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-500/10 text-gray-400">{status}</span>;
    }
  };

  const getCampaignActionLink = (campaign) => {
    switch (campaign.status) {
      case 'DRAFT':
        return `/campaigns/${campaign._id}`; // Upload Customers
      case 'ANALYZED':
        return `/campaigns/${campaign._id}/insights`; // AI Insights
      case 'APPROVED':
        return `/campaigns/${campaign._id}/email-editor`; // Email Editor
      case 'SENT':
      case 'COMPLETED':
        return `/campaigns/${campaign._id}/analytics`; // Analytics Dashboard
      default:
        return `/campaigns/${campaign._id}`;
    }
  };

  const getCampaignActionText = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'Upload List';
      case 'ANALYZED':
        return 'Review Audience';
      case 'APPROVED':
        return 'Draft Email';
      case 'SENT':
      case 'COMPLETED':
        return 'View Stats';
      default:
        return 'Details';
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 pb-12">
      {/* Dynamic Glow Elements */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-darkBg-card/85 backdrop-blur-md border-b border-darkBg-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-600/10 border border-brand-500/20 text-brand-400 rounded-xl">
              <Zap className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Engagement.AI</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-2 p-2 px-3 text-sm text-gray-400 hover:text-white bg-darkBg-lighter hover:bg-darkBg-border border border-darkBg-border rounded-xl transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* User Greetings */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Campaign Operations</h1>
            <p className="text-gray-400 mt-1">Deploy intelligence campaigns and watch engagement in real-time.</p>
          </div>
          <Link to="/campaigns/new" className="btn-premium">
            <Plus className="h-5 w-5" />
            New Campaign
          </Link>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/45 border border-red-500/30 rounded-xl text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Dashboard Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="glass-panel p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Campaigns</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.totalCampaigns}</h3>
            </div>
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-2xl">
              <Layers className="h-6 w-6" />
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Active Campaigns</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.activeCampaigns}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Completed Campaigns</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.completedCampaigns}</h3>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Campaign Lists */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Previous Campaigns</h2>
            <button 
              onClick={fetchCampaigns}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-wider"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <div className="h-8 w-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400 mt-4">Analyzing previous launches...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-darkBg-border/50 rounded-2xl">
              <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">No campaigns found</h3>
              <p className="text-sm text-gray-400 mt-1 mb-6">Get started by building your first shopper engagement funnel.</p>
              <Link to="/campaigns/new" className="btn-premium inline-flex">
                <Plus className="h-4 w-4" /> Create Campaign
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-darkBg-border/50 text-gray-400 text-sm">
                    <th className="pb-3 font-semibold uppercase tracking-wider">Campaign ID</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Campaign Name</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Status</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Date Created</th>
                    <th className="pb-3 text-right font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darkBg-border/30">
                  {campaigns.map((camp) => (
                    <tr key={camp._id} className="text-sm hover:bg-darkBg-lighter/20 transition-all duration-150">
                      <td className="py-4 font-mono font-medium text-brand-300">{camp.campaignId}</td>
                      <td className="py-4 font-semibold text-white">{camp.campaignName}</td>
                      <td className="py-4">{getStatusBadge(camp.status)}</td>
                      <td className="py-4 text-gray-400">{new Date(camp.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 text-right">
                        <Link 
                          to={getCampaignActionLink(camp)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 uppercase tracking-wider bg-brand-500/5 hover:bg-brand-500/10 px-3 py-1.5 border border-brand-500/20 hover:border-brand-500/40 rounded-xl transition-all"
                        >
                          {getCampaignActionText(camp.status)}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
