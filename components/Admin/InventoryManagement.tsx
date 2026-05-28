
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { InventoryItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmReportType, setConfirmReportType] = useState<'WEEK' | 'MONTH' | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unitType: '',
    quantity: '',
    unitPrice: ''
  });

  useEffect(() => {
    refreshItems();
  }, []);

  const refreshItems = () => {
    const data = db.inventory.getAll();
    setItems(data);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      unitType: formData.unitType,
      quantity: Number(formData.quantity),
      lowStockThreshold: 10,
      unitPrice: Number(formData.unitPrice),
      lastUpdated: new Date().toISOString()
    };
    db.inventory.save(newItem);
    refreshItems();
    setIsModalOpen(false);
    setFormData({ name: '', category: '', unitType: '', quantity: '', unitPrice: '' });
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      db.inventory.delete(itemToDelete);
      refreshItems();
      setItemToDelete(null);
    }
  };

  const getFilteredItemsForReport = (period: 'WEEK' | 'MONTH') => {
    const now = new Date();
    const days = period === 'WEEK' ? 7 : 30;
    const cutoff = new Date(now.setDate(now.getDate() - days));
    
    let filteredItems = items.filter(item => new Date(item.lastUpdated) >= cutoff);
    filteredItems.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    return filteredItems;
  };

  const handleDownloadReport = async (period: 'WEEK' | 'MONTH') => {
    const btnId = period === 'WEEK' ? 'btn-week' : 'btn-month';
    const btn = document.getElementById(btnId);
    if (btn) btn.innerText = "Processing...";

    const filteredItems = getFilteredItemsForReport(period);
    const grandTotal = filteredItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    // Create Printable Element dynamically
    const printArea = document.createElement('div');
    printArea.style.width = '800px';
    printArea.style.padding = '40px';
    printArea.style.background = 'white';
    printArea.style.position = 'absolute';
    printArea.style.top = '-10000px';
    printArea.style.left = '0';
    printArea.style.zIndex = '-100'; // Ensure it's behind everything
    document.body.appendChild(printArea);

    // Build HTML Content for PDF with PERFECT Visuals
    printArea.innerHTML = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b;">
        <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; margin: 0; color: #0F172A; text-transform: uppercase; letter-spacing: -0.5px;">ARTI ENGINEERING</h1>
            <p style="font-size: 10px; font-weight: 700; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 5px;">Inventory Management Report</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase;">${period === 'WEEK' ? 'Weekly' : 'Monthly'} Slip</p>
            <p style="font-size: 10px; color: #64748b; margin-top: 2px;">Generated: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 12px 8px; text-align: left; font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; width: 25%;">Item Name</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; width: 15%;">Category</th>
              <th style="padding: 12px 8px; text-align: right; font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; width: 10%;">Qty</th>
              <th style="padding: 12px 8px; text-align: right; font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; width: 15%;">Unit Price</th>
              <th style="padding: 12px 8px; text-align: right; font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; width: 20%;">Total Value</th>
              <th style="padding: 12px 8px; text-align: right; font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; width: 15%;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${filteredItems.map((item, index) => `
              <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 10px 8px; font-size: 11px; font-weight: 600; color: #0F172A;">
                  ${item.name}
                  <div style="font-size: 8px; color: #94a3b8; margin-top: 1px; font-weight: 400;">#${item.id.slice(-6)}</div>
                </td>
                <td style="padding: 10px 8px; font-size: 11px; color: #475569;">${item.category}</td>
                <td style="padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 700; color: #0F172A;">${item.quantity} <span style="font-size: 8px; color: #94a3b8; font-weight: 500;">${item.unitType}</span></td>
                <td style="padding: 10px 8px; text-align: right; font-size: 11px; color: #475569; font-family: monospace;">₹${item.unitPrice.toFixed(2)}</td>
                <td style="padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 700; color: #0F172A; font-family: monospace;">₹${(item.quantity * item.unitPrice).toFixed(2)}</td>
                <td style="padding: 10px 8px; text-align: right; font-size: 10px; color: #64748B;">${new Date(item.lastUpdated).toLocaleDateString()}</td>
              </tr>
            `).join('')}
            ${filteredItems.length === 0 ? `<tr><td colspan="6" style="padding: 30px; text-align: center; color: #94a3b8; font-size: 11px; font-style: italic;">No inventory items found for this period.</td></tr>` : ''}
            
            ${filteredItems.length > 0 ? `
              <tr style="border-top: 2px solid #0F172A;">
                <td colspan="4" style="padding: 15px 8px; text-align: right; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0F172A;">Grand Total Inventory Value</td>
                <td style="padding: 15px 8px; text-align: right; font-size: 14px; font-weight: 800; color: #0F172A; font-family: monospace;">₹${grandTotal.toFixed(2)}</td>
                <td></td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        <div style="margin-top: 60px; padding-top: 20px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between;">
           <div style="text-align: center;">
              <div style="width: 140px; height: 1px; background: #e2e8f0; margin-bottom: 8px; margin-left: auto; margin-right: auto;"></div>
              <p style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Store Manager</p>
           </div>
           <div style="text-align: center;">
              <div style="width: 140px; height: 1px; background: #e2e8f0; margin-bottom: 8px; margin-left: auto; margin-right: auto;"></div>
              <p style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Authorized Signature</p>
           </div>
        </div>
      </div>
    `;

    try {
      // Small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(printArea, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Inventory_${period}_Slip.pdf`);
    } catch (error) {
      console.error('PDF Generation failed', error);
      alert('Failed to generate report.');
    } finally {
      document.body.removeChild(printArea);
      if (btn) btn.innerText = period === 'WEEK' ? '1 Week Slip' : '1 Month Slip';
    }
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  // Helper for Report Preview
  const getPreviewStats = (period: 'WEEK' | 'MONTH' | null) => {
    if (!period) return { count: 0, total: 0 };
    const filtered = getFilteredItemsForReport(period);
    const total = filtered.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
    return { count: filtered.length, total };
  };

  const previewStats = getPreviewStats(confirmReportType);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-oswald font-bold uppercase text-2xl text-slate-900 tracking-tight">Inventory Management</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <button 
            id="btn-week"
            onClick={() => setConfirmReportType('WEEK')}
            className="bg-white border border-gray-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            1 Week Slip
          </button>
          <button 
            id="btn-month"
            onClick={() => setConfirmReportType('MONTH')}
            className="bg-white border border-gray-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            1 Month Slip
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Add Item
          </button>
        </div>
      </div>

      {/* Inventory Table with Increased Fixed Height */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="overflow-x-auto flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-100 shadow-sm">
                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">Item Name</th>
                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">Category</th>
                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right bg-gray-50">Quantity</th>
                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right bg-gray-50">Unit Price</th>
                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right bg-gray-50">Total Value</th>
                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right bg-gray-50">Date</th>
                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center bg-gray-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => {
                const totalValue = item.quantity * item.unitPrice;
                const isLowStock = item.quantity <= item.lowStockThreshold;
                return (
                  <tr key={item.id} className={`group transition-colors ${isLowStock ? 'bg-red-50/20' : 'hover:bg-gray-50/50'}`}>
                    <td className="py-5 px-6">
                      <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">ID: {item.id}</p>
                    </td>
                    <td className="py-5 px-6">
                      <p className="text-xs text-slate-600 font-medium">{item.category}</p>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className={`font-oswald font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-slate-800'}`}>
                          {item.quantity}
                        </span>
                        <span className={`text-[10px] font-bold uppercase ${isLowStock ? 'text-red-400' : 'text-gray-400'}`}>
                          {item.unitType}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <p className="font-oswald text-slate-600 text-sm">₹{item.unitPrice.toFixed(2)}</p>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <p className="font-oswald font-bold text-slate-900 text-sm">₹{totalValue.toFixed(2)}</p>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <p className="text-xs font-bold text-gray-400">{new Date(item.lastUpdated).toLocaleDateString()}</p>
                    </td>
                    <td className="py-5 px-6 text-center">
                       <button 
                        onClick={() => setItemToDelete(item.id)}
                        className="group p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
                        title="Delete Item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Inventory list is empty</td>
                </tr>
              )}
              {items.length > 0 && (
                  <tr className="bg-slate-50 border-t-2 border-slate-100">
                      <td colSpan={4} className="py-5 px-6 text-right text-xs font-black uppercase text-slate-500 tracking-wider">
                          Grand Total Inventory Value
                      </td>
                      <td className="py-5 px-6 text-right">
                          <p className="font-oswald font-bold text-slate-900 text-lg">₹{calculateGrandTotal().toFixed(2)}</p>
                      </td>
                      <td colSpan={2}></td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Preview & Confirmation Modal */}
      <AnimatePresence>
        {confirmReportType && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-14 h-14 bg-construction-yellow/10 text-construction-yellow rounded-2xl flex items-center justify-center mx-auto mb-5">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <h3 className="font-oswald font-bold text-xl mb-1 text-slate-800 uppercase tracking-tight">Report Preview</h3>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-6">
                  {confirmReportType === 'WEEK' ? 'Weekly' : 'Monthly'} Inventory Summary
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Items Found</span>
                  <span className="text-sm font-black text-slate-900">{previewStats.count}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Value</span>
                  <span className="text-lg font-oswald font-bold text-slate-900">₹{previewStats.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                  <button 
                      onClick={() => setConfirmReportType(null)}
                      className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                      Cancel
                  </button>
                  <button 
                      onClick={() => {
                          handleDownloadReport(confirmReportType);
                          setConfirmReportType(null);
                      }}
                      className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-white bg-construction-dark rounded-xl hover:bg-black transition-colors shadow-lg"
                  >
                      Download PDF
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="font-oswald font-bold text-xl mb-2 text-slate-800">Confirm Deletion</h3>
              <p className="text-sm text-gray-500 mb-8 font-medium">
                  Are you sure you want to delete this item? This action will permanently remove it from the inventory.
              </p>
              <div className="flex gap-3">
                  <button 
                      onClick={() => setItemToDelete(null)}
                      className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                      Cancel
                  </button>
                  <button 
                      onClick={confirmDelete}
                      className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                  >
                      Delete Item
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="font-oswald font-bold text-xl text-slate-800">Add New Inventory Item</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-slate-800">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              
              <form onSubmit={handleAddItem} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Item Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Copper Wire Spools"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Electrical"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unit Type</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. rolls, pcs, kg"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                      value={formData.unitType}
                      onChange={e => setFormData({...formData, unitType: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Initial Quantity</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 50"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unit Price (₹)</label>
                    <input 
                      type="number" 
                      required
                      step="0.01"
                      placeholder="e.g. 150.00"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                      value={formData.unitPrice}
                      onChange={e => setFormData({...formData, unitPrice: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3.5 bg-white border border-gray-200 text-slate-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-3.5 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryManagement;
