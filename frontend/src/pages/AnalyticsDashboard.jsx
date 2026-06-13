import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  ArrowLeft, 
  Activity, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  ShoppingBag,
  Send,
  MailCheck,
  CheckCircle,
  Users
} from 'lucide-react';

import { BACKEND_URL } from '../config';

const AnalyticsDashboard = () => {
  const { id } = useParams();
  const { socket, joinCampaign } = useSocket();

  const [campaign, setCampaign] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [comms, setComms] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    purchased: 0,
    openRate: 0,
    clickRate: 0,
    purchaseRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  useEffect(() => {
    if (socket) {
      // Join the room for this campaign
      joinCampaign(id);
      console.log(`Socket.io client: Requesting room join for campaign ${id}`);

      // Register listener for realtime updates
      socket.on('campaign_update', (updatedStats) => {
        if (updatedStats.campaignId === id) {
          console.log('Socket.io: Received campaign stats update:', updatedStats);
          setStats(updatedStats);
          // Refetch communication records to update table
          refetchCommunicationsOnly();
        }
      });

      return () => {
        socket.off('campaign_update');
      };
    }
  }, [socket, id]);

  const fetchInitialData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/campaigns/${id}`);
      setCampaign(response.data.campaign);
      const customersList = response.data.customers || [];
      setCustomers(customersList);
      
      const commsList = response.data.communications || [];
      setComms(commsList);

      // Compute initial stats client-side
      const calculated = calculateStatsLocal(commsList, customersList.length);
      setStats(calculated);
    } catch (error) {
      console.error('Error fetching analytics details:', error);
      setErrorMsg('Failed to load campaign analytics. Verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  const refetchCommunicationsOnly = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/campaigns/${id}`);
      setComms(response.data.communications || []);
    } catch (error) {
      console.error('Failed to refetch communication table logs:', error);
    }
  };

  const calculateStatsLocal = (communications, totalCust) => {
    const sent = communications.length;
    const delivered = communications.filter(c => 
      ['DELIVERED', 'OPENED', 'CLICKED', 'PURCHASED'].includes(c.status)
    ).length;
    const opened = communications.filter(c => 
      ['OPENED', 'CLICKED', 'PURCHASED'].includes(c.status)
    ).length;
    const clicked = communications.filter(c => 
      ['CLICKED', 'PURCHASED'].includes(c.status)
    ).length;
    const purchased = communications.filter(c => 
      c.status === 'PURCHASED'
    ).length;

    const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
    const clickRate = sent > 0 ? Math.round((clicked / sent) * 100) : 0;
    const purchaseRate = sent > 0 ? Math.round((purchased / sent) * 100) : 0;

    return {
      totalCustomers: totalCust,
      sent,
      delivered,
      opened,
      clicked,
      purchased,
      openRate,
      clickRate,
      purchaseRate
    };
  };

  const getCustomerName = (cId) => {
    const shopper = customers.find(c => c._id === cId);
    return shopper ? shopper.name : 'Unknown Recipient';
  };

  const getCustomerEmail = (cId) => {
    const shopper = customers.find(c => c._id === cId);
    return shopper ? shopper.email : '';
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case 'SENT':
        return <span className="text-gray-400 font-medium font-mono text-xs">SENT</span>;
      case 'DELIVERED':
        return <span className="text-blue-400 font-medium font-mono text-xs">DELIVERED</span>;
      case 'OPENED':
        return <span className="text-amber-400 font-semibold font-mono text-xs flex items-center gap-1"><Eye className="h-3 w-3" /> OPENED</span>;
      case 'CLICKED':
        return <span className="text-purple-400 font-bold font-mono text-xs flex items-center gap-1"><MousePointer className="h-3 w-3" /> CLICKED</span>;
      case 'PURCHASED':
        return <span className="text-emerald-400 font-extrabold font-mono text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" /> PURCHASED</span>;
      default:
        return <span>{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 mt-4 font-medium">Opening telemetry dashboard...</p>
      </div>
    );
  }

  // Formatting chart data for Recharts
  const chartData = [
    { name: 'Sent', value: stats.sent, fill: '#8b5cf6' },
    { name: 'Delivered', value: stats.delivered, fill: '#3b82f6' },
    { name: 'Opened', value: stats.opened, fill: '#f59e0b' },
    { name: 'Clicked', value: stats.clicked, fill: '#a855f7' },
    { name: 'Purchased', value: stats.purchased, fill: '#10b981' }
  ];

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Back navigation */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Campaigns Dashboard
        </Link>

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-darkBg-border/40">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Activity className="h-7 w-7 text-brand-400 animate-pulse" />
                Live Campaign Analytics
              </h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse">Realtime Stream</span>
            </div>
            <p className="text-gray-400 mt-1">
              Funnel performance telemetry for <span className="text-white font-semibold">{campaign?.campaignName}</span> ({campaign?.campaignId}).
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 bg-red-950/45 border border-red-500/30 rounded-xl text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Numbers KPI Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <div className="glass-panel p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sent</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold text-white">{stats.sent}</span>
              <Send className="h-4.5 w-4.5 text-brand-400" />
            </div>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivered</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold text-blue-400">{stats.delivered}</span>
              <MailCheck className="h-4.5 w-4.5 text-blue-400" />
            </div>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Opened</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold text-amber-400">{stats.opened}</span>
              <Eye className="h-4.5 w-4.5 text-amber-400" />
            </div>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Clicked</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold text-purple-400">{stats.clicked}</span>
              <MousePointer className="h-4.5 w-4.5 text-purple-400" />
            </div>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Purchased</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-emerald-400">{stats.purchased}</span>
              <ShoppingBag className="h-4.5 w-4.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Funnel Conversions & Rates Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Recharts Conversion Funnel */}
          <div className="glass-panel p-6 lg:col-span-2 flex flex-col">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              Conversion Funnel Volumes
            </h3>
            
            <div className="h-[280px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151c2c', borderColor: '#222f47', color: '#f3f4f6' }}
                    itemStyle={{ color: '#c084fc' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rates and Gauges */}
          <div className="glass-panel p-6 flex flex-col justify-between">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-400" />
              Conversion Rates
            </h3>

            <div className="space-y-6 flex-1 flex flex-col justify-around">
              {/* Open Rate */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Open Rate</h4>
                  <p className="text-xs text-gray-400">Delivered emails opened by shopper</p>
                </div>
                <div className="relative h-14 w-14 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" className="stroke-darkBg-lighter fill-none stroke-[4]" />
                    <circle cx="28" cy="28" r="24" className="stroke-amber-500 fill-none stroke-[4]" 
                            strokeDasharray={2 * Math.PI * 24} 
                            strokeDashoffset={2 * Math.PI * 24 * (1 - stats.openRate / 100)} />
                  </svg>
                  <span className="text-xs font-bold text-amber-400">{stats.openRate}%</span>
                </div>
              </div>

              {/* Click Rate */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Click-Through Rate</h4>
                  <p className="text-xs text-gray-400">Shoppers who clicked tracking links</p>
                </div>
                <div className="relative h-14 w-14 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" className="stroke-darkBg-lighter fill-none stroke-[4]" />
                    <circle cx="28" cy="28" r="24" className="stroke-purple-500 fill-none stroke-[4]" 
                            strokeDasharray={2 * Math.PI * 24} 
                            strokeDashoffset={2 * Math.PI * 24 * (1 - stats.clickRate / 100)} />
                  </svg>
                  <span className="text-xs font-bold text-purple-400">{stats.clickRate}%</span>
                </div>
              </div>

              {/* Purchase Rate */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Purchase Rate</h4>
                  <p className="text-xs text-gray-400">Shoppers completing transaction</p>
                </div>
                <div className="relative h-14 w-14 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" className="stroke-darkBg-lighter fill-none stroke-[4]" />
                    <circle cx="28" cy="28" r="24" className="stroke-emerald-500 fill-none stroke-[4]" 
                            strokeDasharray={2 * Math.PI * 24} 
                            strokeDashoffset={2 * Math.PI * 24 * (1 - stats.purchaseRate / 100)} />
                  </svg>
                  <span className="text-xs font-bold text-emerald-400">{stats.purchaseRate}%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Live Shopper Stream Table */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white mb-1">Live Shopper Interaction Log</h3>
          <p className="text-xs text-gray-400 mb-6">Realtime telemetry logs. Watch customer statuses update live.</p>

          {comms.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              Waiting for email dispatch callback stream...
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-darkBg-border/50 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Recipient Name</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Delivery State</th>
                    <th className="pb-3 text-right font-semibold">Last Action Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darkBg-border/20 text-sm">
                  {comms.map((log) => (
                    <tr key={log._id} className="hover:bg-darkBg-lighter/10 transition-colors">
                      <td className="py-3 font-semibold text-white">
                        <a 
                          href={`/customer/${log.customerId}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:text-brand-400 text-brand-300 font-medium transition-colors underline decoration-brand-500/20"
                        >
                          {getCustomerName(log.customerId)}
                        </a>
                      </td>
                      <td className="py-3 text-gray-400 font-mono text-xs">{getCustomerEmail(log.customerId)}</td>
                      <td className="py-3">{getStatusIndicator(log.status)}</td>
                      <td className="py-3 text-right text-gray-400 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
