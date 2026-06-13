import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Sparkles, 
  ShoppingBag, 
  Gift, 
  MapPin, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

import { BACKEND_URL } from '../config';

const CustomerTracking = () => {
  const { customerId } = useParams();

  const [customer, setCustomer] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [status, setStatus] = useState('OPENED'); // OPENED, CLICKED, PURCHASED
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    // Automatically record OPENED action on page visit
    sendTrackingStatus('OPENED');
  }, [customerId]);

  const sendTrackingStatus = async (targetStatus) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/track/${customerId}`, {
        status: targetStatus
      });
      setCustomer(response.data.customer);
      setCampaign(response.data.campaign);
      setStatus(targetStatus);
      if (targetStatus === 'PURCHASED') {
        setPurchased(true);
      }
    } catch (error) {
      console.error('Error reporting customer tracking telemetry:', error);
      setErrorMsg('Invalid offer link. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
        <div className="h-8 w-8 border-2 border-indigo-600 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 mt-4 font-medium">Unlocking your personalized offer...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 border border-slate-200 text-center">
          <Gift className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Offer Expired</h2>
          <p className="text-sm text-slate-500 mt-2">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
      
      {/* Brand Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-lg">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />
            <span>Storefront</span>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700">VIP Customer Program</span>
        </div>
      </header>

      {/* Main Promo Area */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex flex-col justify-center">
        
        {purchased ? (
          /* Purchased Success State */
          <div className="bg-white shadow-2xl rounded-3xl p-8 border border-slate-100 text-center animate-fade-in space-y-6">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="h-9 w-9" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Thank You, {customer?.name}!</h2>
              <p className="text-slate-500 mt-2">Your order has been placed and is currently being prepared.</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs text-left text-slate-500 space-y-2">
              <p className="font-semibold text-slate-700">Order Information Summary:</p>
              <div>Recipient: {customer?.name}</div>
              <div>Shipping Location: {customer?.city}</div>
              <div>Estimated Delivery: 3-5 Business Days</div>
            </div>

            <p className="text-xs text-slate-400">Order telemetry marked as PURCHASED in Campaign CRM.</p>
          </div>
        ) : (
          /* Active Offer State */
          <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-100">
            {/* Banner Decor */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-8 text-center text-white relative">
              <div className="absolute top-4 right-4 text-white/20"><Sparkles className="h-12 w-12" /></div>
              <h2 className="text-2xl font-black tracking-tight">{campaign?.title}</h2>
              <p className="text-indigo-200 mt-1 text-sm flex items-center justify-center gap-1.5">
                <MapPin className="h-4 w-4" /> Exclusive Offer for {customer?.city}
              </p>
            </div>

            {/* Offer details */}
            <div className="p-8 space-y-8">
              <div className="text-center">
                <p className="text-slate-500 text-sm">Hello, {customer?.name}! Welcome to your dashboard.</p>
                <div className="text-3xl font-extrabold text-indigo-600 mt-2">{campaign?.offer}</div>
              </div>

              {/* Action buttons */}
              <div className="space-y-4">
                <button
                  onClick={() => sendTrackingStatus('OPENED')}
                  className={`w-full py-3.5 px-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border text-sm ${status === 'OPENED' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <Gift className="h-4.5 w-4.5" />
                  View Offer Details
                </button>

                <button
                  onClick={() => sendTrackingStatus('CLICKED')}
                  className={`w-full py-3.5 px-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border text-sm ${status === 'CLICKED' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <Clock className="h-4.5 w-4.5" />
                  Claim Offer Discount
                </button>

                <button
                  onClick={() => sendTrackingStatus('PURCHASED')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 px-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.99] mt-6 text-sm"
                >
                  Complete Purchase Now
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="text-xs text-slate-400 text-center border-t border-slate-100 pt-6">
                Current session state reported as: <span className="font-semibold text-indigo-600">{status}</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Brand Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400">
        © 2026 Storefront Shopper Portal. All rights reserved.
      </footer>

    </div>
  );
};

export default CustomerTracking;
