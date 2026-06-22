'use client';

import React, { useState } from 'react';
import { 
  FileText, FolderOpen, Upload, RefreshCw, Trash2, Download, Eye, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

export interface DocumentItem {
  id: string;
  category: string;
  name: string;
  fileType: 'pdf' | 'jpg' | 'jpeg' | 'png';
  uploadedAt: string;
  fileSize: string;
  content?: string;
  fileUrl?: string;
}

interface DMSSectionProps {
  studentId: string;
  studentName: string;
  documents: DocumentItem[];
  isDarkMode: boolean;
  onAddDocument: (doc: Omit<DocumentItem, 'id'>) => void;
  onDeleteDocument: (docId: string) => void;
  onReplaceDocument: (docId: string, updatedFile: Partial<DocumentItem>) => void;
}

export function DMSSection({
  studentId,
  studentName,
  documents,
  isDarkMode,
  onAddDocument,
  onDeleteDocument,
  onReplaceDocument
}: DMSSectionProps) {
  // Categories required by prompt
  const categoriesList = [
    'Passport', '10th Marks Memo', '12th Marks Memo', 'Degree Certificates', 
    'MOI', 'IELTS', 'Resume', 'SOP', 'LOR', 'Financial Documents', 'Visa Documents', 'Other Documents'
  ];

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(documents[0] || null);
  const [rotateDeg, setRotateDeg] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Custom file upload states
  const [uploadCategory, setUploadCategory] = useState('Passport');
  const [uploadName, setUploadName] = useState('');
  const [uploadFormat, setUploadFormat] = useState<'pdf' | 'jpg' | 'png'>('pdf');
  const [uploadSize, setUploadSize] = useState('1.5 MB');
  const [isUploading, setIsUploading] = useState(false);

  // Device file upload states
  const [selectedDeviceFile, setSelectedDeviceFile] = useState<File | null>(null);
  const [selectedDeviceFileUrl, setSelectedDeviceFileUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDeviceFileDetails(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setDeviceFileDetails(file);
  };

  const setDeviceFileDetails = (file: File) => {
    setSelectedDeviceFile(file);
    
    // Auto-populate document name and format
    const lastDot = file.name.lastIndexOf('.');
    const nameWithoutExt = lastDot > -1 ? file.name.substring(0, lastDot) : file.name;
    const ext = file.name.substring(lastDot + 1).toLowerCase();
    
    setUploadName(nameWithoutExt);
    if (ext === 'pdf') {
      setUploadFormat('pdf');
    } else if (ext === 'jpg' || ext === 'jpeg') {
      setUploadFormat('jpg');
    } else if (ext === 'png') {
      setUploadFormat('png');
    }
    
    // Convert to readable file size
    const mb = file.size / (1024 * 1024);
    if (mb >= 1) {
      setUploadSize(`${mb.toFixed(1)} MB`);
    } else {
      setUploadSize(`${Math.round(file.size / 1024)} KB`);
    }

    // Generate Object URL for previewing
    const url = URL.createObjectURL(file);
    setSelectedDeviceFileUrl(url);
  };

  // Filter or retrieve current file for a category
  const getDocByCategory = (cat: string) => {
    return documents.find(d => d.category === cat);
  };

  // Navigating doc-by-doc inside the viewer
  const handleDocCycle = (direction: 'next' | 'prev') => {
    if (documents.length <= 1) return;
    const currentIndex = documents.findIndex(d => d.id === selectedDoc?.id);
    if (currentIndex === -1) {
      setSelectedDoc(documents[0]);
      return;
    }
    
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= documents.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = documents.length - 1;
    
    setSelectedDoc(documents[nextIndex]);
    setRotateDeg(0);
    setZoomScale(1);
  };

  const handleZoom = (type: 'in' | 'out') => {
    setZoomScale(prev => {
      const next = type === 'in' ? prev + 0.15 : prev - 0.15;
      return Math.max(0.6, Math.min(next, 2));
    });
  };

  const handleRotate = () => {
    setRotateDeg(prev => (prev + 90) % 360);
  };

  const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDoc) return;
    
    const lastDot = file.name.lastIndexOf('.');
    const nameWithoutExt = lastDot > -1 ? file.name.substring(0, lastDot) : file.name;
    const ext = file.name.substring(lastDot + 1).toLowerCase();
    
    const format = (ext === 'pdf' ? 'pdf' : (ext === 'png' ? 'png' : 'jpg')) as 'pdf' | 'jpg' | 'jpeg' | 'png';
    const mb = file.size / (1024 * 1024);
    const sizeStr = mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
    
    const url = URL.createObjectURL(file);
    
    onReplaceDocument(selectedDoc.id, {
      name: file.name,
      fileType: format,
      fileSize: sizeStr,
      fileUrl: url,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      content: `FILE COMPLIANCE VERIFIED\nName: ${file.name}\nSize: ${sizeStr}\nFormat: ${format.toUpperCase()}`
    });
    
    setSelectedDoc(prev => prev ? {
      ...prev,
      name: file.name,
      fileType: format,
      fileSize: sizeStr,
      fileUrl: url,
      content: `FILE COMPLIANCE VERIFIED\nName: ${file.name}\nSize: ${sizeStr}\nFormat: ${format.toUpperCase()}`
    } : null);
  };

  const triggerUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) return;
    setIsUploading(true);

    setTimeout(() => {
      const newDoc: Omit<DocumentItem, 'id'> = {
        category: uploadCategory,
        name: uploadName.endsWith('.' + uploadFormat) ? uploadName : `${uploadName}.${uploadFormat}`,
        fileType: uploadFormat,
        uploadedAt: '15-Jun-2026',
        fileSize: uploadSize,
        content: selectedDeviceFile 
          ? `DEVICE FILE UPLOADED SUCCESSFULLY\nFile: ${selectedDeviceFile.name}\nSize: ${uploadSize}\nType: ${selectedDeviceFile.type}\nLast Modified: ${new Date(selectedDeviceFile.lastModified).toLocaleDateString()}`
          : `SIMULATED FILE CANOPY\nCategory: ${uploadCategory}\nFile: ${uploadName}\nUploaded by Counsellor\nAcademic Verification Code: SUCCESS-ED-2026`,
        fileUrl: selectedDeviceFileUrl || undefined
      };
      onAddDocument(newDoc);
      
      // Select the newly uploaded doc
      const mockId = `temp-${Date.now()}`;
      setSelectedDoc({ ...newDoc, id: mockId });
      
      setIsUploading(false);
      setUploadName('');
      setSelectedDeviceFile(null);
      setSelectedDeviceFileUrl('');
    }, 850);
  };

  const triggerDownloadSim = (doc: DocumentItem) => {
    // Generate toast trigger or simulate actual text block link downloads
    const blob = new Blob([doc.content || 'Overseas CRM Document Content'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerReplaceSim = (docId: string, category: string) => {
    const updatedName = `Replaced_${category}_Review_Copy.pdf`;
    onReplaceDocument(docId, {
      name: updatedName,
      uploadedAt: '15-Jun-2026',
      fileSize: '1.8 MB',
      content: `REPLACED DOCUMENT COOPERATIVE\nCategory: ${category}\nVersion: 2.0 (Verified SLA Approved)\nReplaced On: 15-Jun-2026`
    });
    
    // Auto re-select
    const target = documents.find(d => d.id === docId);
    if (target) {
      setSelectedDoc({
        ...target,
        name: updatedName,
        uploadedAt: '15-Jun-2026',
        fileSize: '1.8 MB',
        content: `REPLACED DOCUMENT COOPERATIVE\nCategory: ${category}\nVersion: 2.0 (Verified SLA Approved)\nReplaced On: 15-Jun-2026`
      });
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6" id="dms-layout-root">
      
      {/* LEFT COLUMN: 12 FOLDERS DIRECTORY */}
      <div className="xl:col-span-2 space-y-6">
        <div className={`p-5 rounded-3xl border shadow-sm dark:bg-[#141821] dark:border-[#141821] bg-white border-slate-100`}>
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Overseas Document Folders</h4>
              <p className="text-[10px] text-slate-400">Strict standard files compliance checklists ({documents.length} of 12 uploaded)</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {categoriesList.map(category => {
              const file = getDocByCategory(category);
              return (
                <div 
                  key={category}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                    file 
                      ? selectedDoc?.id === file.id
                        ? 'border-red-500 bg-red-600/5 dark:bg-red-600/10'
                        : 'border-slate-200 dark:border-slate-800 bg-emerald-500/5 hover:border-red-600/40'
                      : 'border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className={`h-4.5 w-4.5 shrink-0 ${file ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-slate-700 dark:text-slate-300 truncate">{category}</div>
                      {file ? (
                        <p className="text-[10px] text-slate-400 truncate tracking-tight">{file.name} · {file.fileSize}</p>
                      ) : (
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-0.5 mt-0.5">
                          <AlertCircle className="h-3 w-3" /> Missing Checklist Item
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-1 shrink-0">
                    {file ? (
                      <>
                        <button
                          onClick={() => { setSelectedDoc(file); setRotateDeg(0); setZoomScale(1); }}
                          className="p-1 px-1.5 bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-slate-800 rounded-lg text-slate-400 font-bold text-[10px] inline-flex items-center gap-0.5 transition-colors"
                          title="Preview document"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => triggerReplaceSim(file.id, file.category)}
                          className="p-1 px-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 rounded-lg text-slate-400 font-bold text-[10px]"
                          title="Replace document"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => triggerDownloadSim(file)}
                          className="p-1 px-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 rounded-lg text-slate-400 font-bold text-[10px]"
                          title="Download document text file"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            onDeleteDocument(file.id);
                            if (selectedDoc?.id === file.id) {
                              const remaining = documents.filter(d => d.id !== file.id);
                              setSelectedDoc(remaining[0] || null);
                            }
                          }}
                          className="p-1 px-1.5 bg-slate-100 hover:bg-rose-600 hover:text-white dark:bg-slate-800 rounded-lg text-slate-400 font-bold text-[10px]"
                          title="Delete checklist document"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setUploadCategory(category);
                          setUploadName(`${category}_Verified_${studentName.replace(/\s+/g, '_')}`);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-0.5 uppercase tracking-wide transition-colors"
                      >
                        <Upload className="h-3 w-3" /> Upload
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CUSTOM DMS FILE UPLOADER WIZARD */}
        <div className={`p-5 rounded-3xl border shadow-sm dark:bg-[#141821] dark:border-[#141821] bg-white border-slate-100`}>
          <h4 className="text-xs font-black uppercase tracking-wider mb-3 text-slate-800 dark:text-slate-100">DMS Upload Portal File Desk</h4>
          
          <form onSubmit={triggerUpload} className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">Target Folder Classification</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#141821] dark:border-[#141821] dark:text-slate-200 text-slate-800 bg-white border-slate-100`}
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">Digital format</label>
                <select
                  value={uploadFormat}
                  onChange={(e) => setUploadFormat(e.target.value as any)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 bg-slate-50 border-slate-200 text-slate-800`}
                >
                  <option value="pdf">PDF File</option>
                  <option value="jpg">JPG Image</option>
                  <option value="png">PNG Image</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">Simulated Size</label>
                <select
                  value={uploadSize}
                  onChange={(e) => setUploadSize(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 bg-slate-50 border-slate-200`}
                >
                  <option value="1.2 MB">1.2 MB</option>
                  <option value="2.1 MB">2.1 MB</option>
                  <option value="510 KB">510 KB</option>
                  <option value="4.5 MB">4.5 MB</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">Counsellor Document Title</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="e.g. My_Degree_Convocat_Copy"
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 bg-slate-50 border-slate-200 text-slate-800`}
                required
              />
            </div>

            {/* DEVICE FILE DRAG AND DROP ZONE */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-black block mb-0.5">Device File Attachment</label>
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-3.5 text-center transition-all relative group ${
                  isDragging 
                    ? 'border-red-500 bg-red-500/5 scale-[1.01]' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-red-650'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="device-file-picker"
                />
                <div className="flex flex-col items-center justify-center gap-1">
                  <Upload className={`h-5 w-5 transition-colors ${selectedDeviceFile ? 'text-emerald-500' : 'text-slate-400 group-hover:text-red-500'}`} />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-full block px-2">
                    {selectedDeviceFile ? selectedDeviceFile.name : 'Drag & Drop file or Click to Browse'}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {selectedDeviceFile ? `Selected Class: ${uploadFormat.toUpperCase()} · ${uploadSize}` : 'Supports PDF, JPG, PNG from local system'}
                  </span>
                </div>
              </div>
              {selectedDeviceFile && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDeviceFile(null);
                      setSelectedDeviceFileUrl('');
                      setUploadName('');
                    }}
                    className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                  >
                    Clear Attachment
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isUploading || !uploadName.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-extrabold text-xs py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-lg shadow-red-600/10 transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Configuring SLA Vault...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Submit Document to Filesystem</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT COLUMN: INTEGRATED DOCUMENT VIEWER SCREEN */}
      <div className="xl:col-span-3">
        <div className={`p-5 rounded-3xl border shadow-sm min-h-[550px] flex flex-col justify-between dark:bg-[#12161F] dark:border-[#12161F] bg-white border-slate-100`} id="document-viewer-box">
          
          {/* TOP DIALOG CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-inherit">
            <div>
              <span className="text-[9px] font-mono font-black text-red-600 bg-red-600/5 px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-red-600/10 mb-1.5 block max-w-fit">
                LIVE SECURE ENCRYPTED VIEWER
              </span>
              <h5 className="font-extrabold text-xs truncate max-w-[280px] text-[#12161F] dark:text-slate-100" title={selectedDoc?.name || 'No Selected Document'}>
                {selectedDoc ? selectedDoc.name : 'No Active File Loaded'}
              </h5>
              <p className="text-[10px] text-slate-400">
                {selectedDoc ? `${selectedDoc.category} | ${selectedDoc.fileSize}` : 'DMS is currently idling'}
              </p>
            </div>

            {selectedDoc && (
              <div className="flex items-center gap-1 self-end sm:self-auto">
                {/* Prev doc */}
                <button
                  onClick={() => handleDocCycle('prev')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-[#12161F] text-slate-400 transition-colors"
                  title="Previous Document"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {/* Page info tag */}
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-850 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                  Checklist: {documents.findIndex(d => d.id === selectedDoc.id) + 1} / {documents.length}
                </span>
                {/* Next doc */}
                <button
                  onClick={() => handleDocCycle('next')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-[#12161F] text-slate-400 transition-colors"
                  title="Next Document"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* INNER CANVAS */}
          <div className="flex-1 my-4 flex items-center justify-center p-4 bg-slate-100 dark:bg-[#12161F]/10 rounded-2xl overflow-hidden min-h-[380px] relative">
            <AnimatePresence mode="wait">
              {!selectedDoc ? (
                <motion.div
                  key="empty-viewer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center max-w-xs space-y-3"
                >
                  <div className="bg-red-600/10 h-12 w-12 rounded-full text-red-656 text-red-600 flex items-center justify-center mx-auto">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">File Vault Display Waiting</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Select a checklist folder file on the left side menu, or click the preview button to launch the high-contrast document visualizer.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedDoc.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full h-full flex items-center justify-center pt-2"
                >
                  {/* CANVAS CONTENT AREA */}
                  <div 
                    className="transition-transform duration-200 origin-center text-xs shadow-lg max-w-full max-h-full"
                    style={{ 
                      transform: `rotate(${rotateDeg}deg) scale(${zoomScale})`,
                      width: '100%',
                      maxWidth: '380px'
                    }}
                  >
                    
                    {selectedDoc.fileUrl ? (
                      <div className="bg-white text-slate-900 border border-slate-300 rounded-lg p-3 min-h-[330px] flex flex-col justify-between shadow-sm overflow-hidden select-none">
                        <div className="border-b border-slate-200 pb-1.5 text-center leading-snug">
                          <div className="text-[10px] font-black tracking-wider text-red-600 uppercase">SECURE DEVICE ATTACHMENT</div>
                          <div className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase">{selectedDoc.category} · {selectedDoc.fileSize}</div>
                        </div>

                        <div className="my-3 flex-1 flex items-center justify-center overflow-hidden max-h-[250px] bg-slate-55 rounded-lg border border-slate-100 p-1">
                          {selectedDoc.fileType === 'pdf' ? (
                            <iframe 
                              src={selectedDoc.fileUrl} 
                              className="w-full h-[220px] rounded border-0" 
                              title={selectedDoc.name}
                            />
                          ) : (
                            <img 
                              src={selectedDoc.fileUrl} 
                              className="max-w-full max-h-[220px] object-contain rounded" 
                              alt={selectedDoc.name} 
                            />
                          )}
                        </div>

                        <div className="text-[8px] font-mono text-center text-slate-400 tracking-tight">
                          FILE NAME: {selectedDoc.name}
                        </div>
                      </div>
                    ) : (
                      /* Minimalist Clean Option & Preview */
                      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-850 rounded-2xl p-5 min-h-[330px] flex flex-col justify-between shadow-sm select-none">
                        <div className="text-center space-y-2 py-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto text-red-656 text-red-600">
                            <Upload className="h-4.5 w-4.5 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                              {selectedDoc.category} Draft File Pending
                            </h4>
                            <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                              No official document attached. Please upload a PDF or Image.
                            </p>
                          </div>
                        </div>

                        {/* Upload Option Directly inside view canvas */}
                        <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950/40 relative flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-950 transition-all cursor-pointer">
                          <input 
                            type="file" 
                            accept=".pdf,.jpg,.jpeg,.png" 
                            onChange={handleInlineFileChange} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <Upload className="h-4 w-4 text-slate-400 mb-1" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Upload / Attach Device File here</span>
                          <span className="text-[8px] text-slate-400 uppercase font-mono mt-0.5">PDF, JPG, PNG format</span>
                        </div>

                        {/* Plain Clean Text Draft Preview (absolutely no layouts or official simulated letterhead) */}
                        {selectedDoc.content && (
                          <div className="mt-3 p-2.5 border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/10 rounded-lg max-h-[120px] overflow-y-auto">
                            <span className="text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1 font-mono">Draft text description</span>
                            <pre className="text-[9px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap break-all">
                              {selectedDoc.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LOWER INTERACTIVE ACTION BAR */}
          {selectedDoc && (
            <div className="pt-3 border-t border-inherit flex items-center justify-between gap-2.5 text-slate-400">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleZoom('out')}
                  className="p-1 px-2 bg-slate-105 hover:bg-red-600 hover:text-white dark:bg-slate-850 rounded-lg text-slate-400 font-bold text-[10px] inline-flex items-center gap-0.5"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold bg-slate-105 dark:bg-slate-850 px-2 rounded-lg py-1">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => handleZoom('in')}
                  className="p-1 px-2 bg-slate-105 hover:bg-red-600 hover:text-white dark:bg-slate-850 rounded-lg text-slate-400 font-bold text-[10px] inline-flex items-center gap-0.5"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleRotate}
                  className="p-1 px-2.5 bg-slate-105 hover:bg-red-600 hover:text-white dark:bg-slate-850 rounded-lg text-slate-400 font-bold text-[10px] inline-flex items-center gap-1 transition-all"
                  title="Rotate Document 90 Degrees"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Rotate 90°</span>
                </button>

                <button
                  onClick={() => setIsFullscreen(prev => !prev)}
                  className={`p-1 px-2.5 bg-slate-105 hover:bg-red-600 hover:text-white dark:bg-slate-850 rounded-lg text-slate-400 font-bold text-[10px] inline-flex items-center gap-1 transition-all ${
                    isFullscreen ? 'border border-red-500 text-red-500' : ''
                  }`}
                  title="Toggle Fullscreen Lightbox"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Minimize</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Lightbox</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FULLSCREEN DISPLAY PORTAL BOX IMAGE/PDF LIGHTBOX */}
      {isFullscreen && selectedDoc && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col justify-between p-6">
          <div className="flex items-center justify-between text-white border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider">{selectedDoc.category} · Preview</h4>
              <p className="text-xs text-slate-400">{selectedDoc.name} ({selectedDoc.fileSize})</p>
            </div>
            
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-full"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            {selectedDoc.fileUrl ? (
              <div 
                className="bg-white text-slate-900 rounded-xl p-4 shadow-2xl relative transition-transform"
                style={{ 
                  transform: `rotate(${rotateDeg}deg) scale(${zoomScale * 1.3})`,
                  width: '100%',
                  maxWidth: '560px',
                  minHeight: '440px'
                }}
              >
                {selectedDoc.fileType === 'pdf' ? (
                  <iframe 
                    src={selectedDoc.fileUrl} 
                    className="w-full h-[400px] rounded-lg border border-slate-200" 
                    title={selectedDoc.name}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <img 
                      src={selectedDoc.fileUrl} 
                      className="max-w-full max-h-[400px] object-contain rounded-md" 
                      alt={selectedDoc.name} 
                    />
                    <div className="text-center text-xs font-bold text-slate-500 mt-3">{selectedDoc.name}</div>
                  </div>
                )}
              </div>
            ) : (
              /* Minimal Plain Screen Fullscreen */
              <div 
                className="bg-white text-slate-900 rounded-xl p-10 shadow-2xl relative transition-transform flex flex-col justify-between"
                style={{ 
                  transform: `rotate(${rotateDeg}deg) scale(${zoomScale * 1.3})`,
                  width: '100%',
                  maxWidth: '480px',
                  minHeight: '380px'
                }}
              >
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2 border-b pb-1">
                    {selectedDoc.category} · General Info
                  </h4>
                  <pre className="text-xs font-mono text-slate-800 break-words whitespace-pre-wrap leading-relaxed py-2">
                    {selectedDoc.content || 'No text content available'}
                  </pre>
                </div>

                <div className="border-t border-slate-200 mt-4 pt-3 text-[10px] text-slate-400 text-center font-mono">
                  FILE ID: {selectedDoc.id}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 border-t border-slate-850 pt-3 text-white">
            <button onClick={() => handleZoom('out')} className="p-2 bg-slate-800 hover:bg-red-650 rounded-lg"><ZoomOut className="h-4 w-4" /></button>
            <span className="text-xs font-mono font-bold px-3">{Math.round(zoomScale * 100)} %</span>
            <button onClick={() => handleZoom('in')} className="p-2 bg-slate-800 hover:bg-red-650 rounded-lg"><ZoomIn className="h-4 w-4" /></button>
            <button onClick={handleRotate} className="p-2 bg-slate-800 hover:bg-red-650 rounded-lg ml-2 flex items-center gap-1.5 text-xs"><RotateCw className="h-4 w-4" /> Rotate</button>
            <button onClick={() => triggerDownloadSim(selectedDoc)} className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg ml-2 flex items-center gap-1.5 text-xs"><Download className="h-4 w-4" /> Download Text Copy</button>
          </div>
        </div>
      )}

    </div>
  );
}
