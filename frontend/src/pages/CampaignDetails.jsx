import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, 
  UploadCloud, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  DollarSign, 
  ShoppingCart,
  FileSpreadsheet
} from 'lucide-react';

import { BACKEND_URL } from '../config';

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [campaign, setCampaign] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/campaigns/${id}`);
      setCampaign(response.data.campaign);
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      setErrorMsg('Failed to load campaign. Please return to dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // Metrics calculations
  const totalCustomers = customers.length;
  const avgSpend = totalCustomers > 0 
    ? Math.round(customers.reduce((sum, c) => sum + c.totalSpend, 0) / totalCustomers) 
    : 0;
  const avgOrders = totalCustomers > 0 
    ? Number((customers.reduce((sum, c) => sum + c.totalOrders, 0) / totalCustomers).toFixed(1)) 
    : 0;

  // Process File Parsing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setUploading(true);

    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          processParsedData(results.data);
        },
        error: (err) => {
          setErrorMsg(`CSV parsing error: ${err.message}`);
          setUploading(false);
        }
      });
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          processParsedData(jsonData);
        } catch (err) {
          setErrorMsg(`Excel parsing error: ${err.message}`);
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setErrorMsg('Error reading file.');
        setUploading(false);
      };
      reader.readAsBinaryString(file);
    } else {
      setErrorMsg('Invalid file format. Please upload CSV or Excel files.');
      setUploading(false);
    }
  };

  const processParsedData = async (data) => {
    // Validate length
    if (data.length < 5) {
      setErrorMsg('Campaign requirements failed: A minimum of 5 customers is required.');
      setUploading(false);
      return;
    }

    // Required headers validation
    const requiredKeys = ['name', 'age', 'city', 'email', 'totalOrders', 'totalSpend', 'lastOrders'];
    const row0 = data[0];
    const missingKeys = requiredKeys.filter(k => !(k in row0));

    if (missingKeys.length > 0) {
      setErrorMsg(`Missing required columns: ${missingKeys.join(', ')}. Expected: name, age, city, email, totalOrders, totalSpend, lastOrders`);
      setUploading(false);
      return;
    }

    // Format fields correctly
    const formattedData = data.map(item => ({
      name: String(item.name).trim(),
      age: Number(item.age),
      city: String(item.city).trim(),
      email: String(item.email).trim().toLowerCase(),
      totalOrders: Number(item.totalOrders),
      totalSpend: Number(item.totalSpend),
      lastOrders: String(item.lastOrders).trim()
    }));

    try {
      const response = await axios.post(`${BACKEND_URL}/campaigns/${id}/customers`, {
        customers: formattedData
      });
      setCustomers(response.data.customers);
      setSuccessMsg(`Uploaded ${response.data.count} customers successfully.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Customer upload api failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save customer data onto server.');
    } finally {
      setUploading(false);
    }
  };

  const triggerAnalyze = async () => {
    setErrorMsg('');
    setAnalyzing(true);
    try {
      await axios.post(`${BACKEND_URL}/ai/${id}/analyze`);
      navigate(`/campaigns/${id}/insights`);
    } catch (error) {
      console.error('Audience analysis error:', error);
      setErrorMsg(error.response?.data?.message || 'AI Audience analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = 
      "name,age,city,email,totalOrders,totalSpend,lastOrders\n" +
      "Sophia Miller,29,Chicago,sophia.miller@example.com,12,650,14\n" +
      "Jackson Davis,42,Miami,jackson.davis@example.com,2,45,98\n" +
      "Isabella Wilson,35,Seattle,isabella.wilson@example.com,9,380,21\n" +
      "Lucas Martinez,24,Boston,lucas.martinez@example.com,1,15,5\n" +
      "Amelia Anderson,51,Dallas,amelia.anderson@example.com,15,920,45\n" +
      "Oliver Taylor,31,Austin,oliver.taylor@example.com,5,150,12\n" +
      "Emma Thomas,45,Denver,emma.thomas@example.com,4,110,120";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "crm_sample_customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 mt-4 font-medium">Booting campaign workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-darkBg-border/40">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{campaign?.campaignName}</h1>
              <span className="px-3 py-1 font-mono text-xs bg-darkBg-lighter text-brand-300 border border-darkBg-border rounded-lg">{campaign?.campaignId}</span>
            </div>
            <p className="text-gray-400 mt-1">Configure and analyze customer profiles for targeting.</p>
          </div>

          {totalCustomers >= 5 && (
            <button 
              onClick={triggerAnalyze}
              disabled={analyzing}
              className="btn-premium px-6 py-3 font-semibold text-base"
            >
              {analyzing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Segmenting Audience...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-brand-200 fill-brand-200" />
                  ✨ Analyze Audience
                </>
              )}
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/45 border border-red-500/30 rounded-xl text-red-200 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-950/45 border border-green-500/30 rounded-xl text-green-200 text-sm flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {totalCustomers === 0 ? (
          /* Empty Workspace / Upload UI */
          <div className="max-w-2xl mx-auto mt-8">
            <div className="glass-panel p-10 text-center flex flex-col items-center">
              <div className="p-4 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-full mb-4">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Upload Customer Directory</h3>
              <p className="text-sm text-gray-400 max-w-sm mb-6">
                Please upload a CSV or Excel (.xlsx) file containing your customer database. A minimum of 5 records is required.
              </p>

              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv, .xlsx, .xls"
                className="hidden"
              />

              <div className="flex gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-premium px-6 py-2.5"
                >
                  {uploading ? 'Parsing File...' : 'Choose File'}
                </button>
                <button 
                  onClick={downloadSampleTemplate}
                  className="btn-secondary"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  Download CSV Template
                </button>
              </div>

              <div className="mt-8 text-xs text-left text-gray-500 border-t border-darkBg-border/40 pt-4 w-full">
                <p className="font-semibold text-gray-400 mb-1">Expected schema headers (lowercase):</p>
                <code className="text-brand-300 bg-darkBg px-2 py-1 rounded select-all block mt-1 overflow-x-auto">
                  name, age, city, email, totalOrders, totalSpend, lastOrders
                </code>
              </div>
            </div>
          </div>
        ) : (
          /* Active Workspace: Metrics & Table */
          <div className="space-y-8">
            {/* Customer Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="glass-panel p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Uploaded</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{totalCustomers} Shoppers</h3>
                </div>
                <div className="p-3 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-2xl">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              <div className="glass-panel p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Average Spend</p>
                  <h3 className="text-2xl font-bold text-white mt-1">${avgSpend}</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>

              <div className="glass-panel p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Average Orders</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{avgOrders} purchases</h3>
                </div>
                <div className="p-3 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-2xl">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Table Panel */}
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Audience Database</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Double check demographic fields before invoking AI.</p>
                </div>

                <div className="flex gap-3">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn-secondary text-xs"
                  >
                    Replace Data
                  </button>
                  <button 
                    onClick={async () => {
                      if (window.confirm('Delete customer list for this campaign?')) {
                        try {
                          await axios.post(`${BACKEND_URL}/campaigns/${id}/customers`, { customers: [] }).catch(() => {});
                          setCustomers([]);
                        } catch (e) {}
                      }
                    }}
                    className="flex items-center gap-1.5 p-2 px-3 text-xs bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear List
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-darkBg-border/50 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Name</th>
                      <th className="pb-3 font-semibold">Age</th>
                      <th className="pb-3 font-semibold">City</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Orders</th>
                      <th className="pb-3 font-semibold">Total Spend</th>
                      <th className="pb-3 font-semibold">Last Order (Days)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-darkBg-border/20 text-sm">
                    {customers.map((cust) => (
                      <tr key={cust._id} className="hover:bg-darkBg-lighter/10 transition-colors">
                        <td className="py-3.5 font-semibold text-white">{cust.name}</td>
                        <td className="py-3.5 text-gray-300">{cust.age}</td>
                        <td className="py-3.5 text-gray-300">{cust.city}</td>
                        <td className="py-3.5 text-gray-400 font-mono text-xs">{cust.email}</td>
                        <td className="py-3.5 text-gray-300 font-semibold">{cust.totalOrders}</td>
                        <td className="py-3.5 text-emerald-400 font-semibold">${cust.totalSpend}</td>
                        <td className="py-3.5 text-gray-400">{cust.lastOrders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CampaignDetails;
