import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { store } from './store';
import { Provider } from 'react-redux';
import { analyzeComplaint } from './store/complaintSlice';
import { ShieldAlert, Activity, FileText, CheckCircle, RefreshCw } from 'lucide-react';

function Dashboard() {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.complaints);

  const [formData, setFormData] = useState({
    customer_name: '',
    product_name: '',
    batch_number: '',
    complaint_text: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.complaint_text) return;
    dispatch(analyzeComplaint(formData));
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '24px' }}>
      {/* Header Panel */}
      <header style={{ backgroundColor: '#ffffff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>AIVOA QMS — Customer Complaint Management AI Portal</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Form Control Section */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', color: '#334155', marginBottom: '20px', fontWeight: '600' }}>Log Customer Complaint Form</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#64748b', fontSize: '14px' }}>Customer Name</label>
              <input type="text" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} placeholder="e.g. Apollo Pharmacy Corp" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} />
            </div>
            <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#64748b', fontSize: '14px' }}>Product Name / API / FDF</label>
                <input type="text" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} placeholder="e.g. Paracetamol API 500mg" value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#64748b', fontSize: '14px' }}>Batch Number</label>
                <input type="text" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} placeholder="e.g. B-4029-PM" value={formData.batch_number} onChange={(e) => setFormData({...formData, batch_number: e.target.value})} />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#64748b', fontSize: '14px' }}>Complaint Raw Narrative (Paste Email or PDF Text)</label>
              <textarea rows="6" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'none', boxSizing: 'border-box' }} placeholder="e.g. Received a complaint from overseas distribution hub regarding unexpected discoloration and chipping on tablet surfaces in batch B-4029-PM..." value={formData.complaint_text} onChange={(e) => setFormData({...formData, complaint_text: e.target.value})} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
              {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Invoke AI Workflow Execution'}
            </button>
          </form>
          {error && <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '6px', fontSize: '14px' }}>{error}</div>}
        </div>

        {/* Right Output Dashboard Component */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', color: '#334155', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <ShieldAlert color="#2563eb" /> AI Copilot Analytics & Risk Assessment
          </h2>

          {data ? (
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
                <CheckCircle color="#16a34a" />
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Generated Complaint Reference</div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{data.complaint_ref}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>AI Risk Level</div>
                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' }}>
                    {data.ai_risk_classification}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '14px' }}><Activity size={16} color="#2563eb"/> Root Cause Analysis (RCA) Recommendation</h4>
                <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '14px', color: '#334155', border: '1px solid #e2e8f0', whiteSpace: 'pre-line', lineHeight: '1.5' }}>{data.root_cause_analysis}</div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '14px' }}><FileText size={16} color="#2563eb"/> CAPA Action Strategy</h4>
                <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '14px', color: '#334155', border: '1px solid #e2e8f0', whiteSpace: 'pre-line', lineHeight: '1.5' }}>{data.capa_recommendation}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '300px', color: '#94a3b8' }}>
              <Activity size={48} style={{ marginBottom: '12px', color: '#cbd5e1' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Fill out the form and submit to trigger LangGraph AI Engine parsing loops.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Dashboard />
    </Provider>
  );
}
