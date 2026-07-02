'use client';

import React, { useState, useRef } from 'react';
import {
  FileText, FolderOpen, Upload, RefreshCw, Trash2, Download, Eye,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'sonner';

export interface DocumentItem {
  id: string;
  name?: string;
  address: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
}

interface DMSSectionProps {
  studentId: string;
  studentName: string;
  documents: DocumentItem[];
  isDarkMode: boolean;
  onAddDocument: (doc: Omit<DocumentItem, 'id'>) => void;
  onDeleteDocument: (docId: string) => void;
  reloadStudent: () => Promise<void>;
  onReplaceDocument: (docId: string, updatedFile: Partial<DocumentItem>) => void;
}

export function DMSSection({
  studentId,
  studentName,
  documents,
  isDarkMode,
  onAddDocument,
  onDeleteDocument,
  onReplaceDocument,
  reloadStudent,
}: DMSSectionProps) {
  const categoriesList = [
    'Passport', '10th Marks Memo', '12th Marks Memo', 'Degree Certificates',
    'MOI', 'IELTS', 'Resume', 'SOP', 'LOR', 'Financial Documents', 'Visa Documents', 'Other Documents'
  ];

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(documents[0] || null);
  const [rotateDeg, setRotateDeg] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload wizard state
  const [uploadCategory, setUploadCategory] = useState('Passport');
  const [uploadName, setUploadName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Find a document by its type (category) */
  const getDocByCategory = (cat: string) =>
    documents.find(d => d.type === cat) ?? null;

  /** Derive a human-readable file size from the address URL or fall back to '–' */
  const getFileType = (doc: DocumentItem) => {
    const ext = doc.address?.split('.').pop()?.toLowerCase() ?? '';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['jpg', 'jpeg'].includes(ext)) return 'jpg';
    if (['png'].includes(ext)) return 'png';
    return ext || 'file';
  };

  const isPdf = (doc: DocumentItem) => getFileType(doc) === 'pdf';

  // ─── Navigation ────────────────────────────────────────────────────────────

  const handleDocCycle = (direction: 'next' | 'prev') => {
    if (documents.length <= 1) return;
    const currentIndex = documents.findIndex(d => d.id === selectedDoc?.id);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= documents.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = documents.length - 1;
    setSelectedDoc(documents[nextIndex]);
    setRotateDeg(0);
    setZoomScale(1);
  };

  const handleZoom = (type: 'in' | 'out') => {
    setZoomScale(prev => Math.max(0.6, Math.min(type === 'in' ? prev + 0.15 : prev - 0.15, 2)));
  };

  const handleRotate = () => setRotateDeg(prev => (prev + 90) % 360);

  // ─── Upload (wizard form) ──────────────────────────────────────────────────

  const handleWizardFilePick = (file: File) => {
    setPendingFile(file);
    const lastDot = file.name.lastIndexOf('.');
    const nameWithoutExt = lastDot > -1 ? file.name.substring(0, lastDot) : file.name;
    setUploadName(nameWithoutExt);
  };

  const handleWizardDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleWizardFilePick(file);
  };

  const triggerUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFile || !uploadName.trim()) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', pendingFile);
      formData.append('name', uploadName);
      formData.append('type', uploadCategory);

      const res = await fetch(`/api/student/docupload?id=${studentId}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) return toast.error(data.message);

      toast.success('Document uploaded.');
      await reloadStudent();
      setUploadName('');
      setPendingFile(null);
    } catch (err) {
      console.error(err);
      toast.error('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Upload (quick button per category row) ────────────────────────────────

  const handleQuickUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCategory(category);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', `${category}_${studentName.replace(/\s+/g, '_')}`);
      formData.append('type', category);

      const res = await fetch(`/api/student/docupload?id=${studentId}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) return toast.error(data.message);

      toast.success('Document uploaded.');
      await reloadStudent();
    } catch (err) {
      console.error(err);
      toast.error('Upload failed.');
    } finally {
      setUploadingCategory(null);
      // reset so same file can be re-picked
      e.target.value = '';
    }
  };

  // ─── Replace ───────────────────────────────────────────────────────────────

  const handleReplaceFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    doc: DocumentItem,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Delete old, then upload new with same type/name
      await fetch(`/api/student/docupload?id=${doc.id}`, { method: 'DELETE' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', doc.name || file.name);
      formData.append('type', doc.type || '');

      const res = await fetch(`/api/student/docupload?id=${studentId}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) return toast.error(data.message);

      toast.success('Document replaced.');
      await reloadStudent();
      setSelectedDoc(null);
    } catch (err) {
      console.error(err);
      toast.error('Replace failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (doc: DocumentItem) => {
    try {
      const res = await fetch(`/api/student/docupload?id=${doc.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        return toast.error(data.message);
      }
      toast.success('Document deleted.');
      if (selectedDoc?.id === doc.id) {
        const remaining = documents.filter(d => d.id !== doc.id);
        setSelectedDoc(remaining[0] || null);
      }
      await reloadStudent();
    } catch (err) {
      console.error(err);
      toast.error('Delete failed.');
    }
  };

  // ─── Download ──────────────────────────────────────────────────────────────

  const handleDownload = (doc: DocumentItem) => {
    // Open the real file URL in a new tab / trigger browser download
    const a = document.createElement('a');
    a.href = doc.address;
    a.download = doc.name || 'document';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6" id="dms-layout-root">

      {/* LEFT COLUMN */}
      <div className="xl:col-span-2 space-y-6">
        <div className="p-5 rounded-3xl border shadow-sm dark:bg-[#141821] dark:border-[#141821] bg-white border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Overseas Document Folders</h4>
              <p className="text-[10px] text-slate-400">
                Strict standard files compliance checklists ({documents.length} of 12 uploaded)
              </p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {categoriesList.map(category => {
              const file = getDocByCategory(category);
              // Each row needs its own hidden replace-input
              const replaceInputId = `replace-input-${category.replace(/\s+/g, '-')}`;
              const quickInputId = `quick-input-${category.replace(/\s+/g, '-')}`;

              return (
                <div
                  key={category}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${file
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
                        <p className="text-[10px] text-slate-400 truncate tracking-tight">
                          {file.name || file.address.split('/').pop()} · {getFileType(file).toUpperCase()}
                        </p>
                      ) : (
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-0.5 mt-0.5">
                          <AlertCircle className="h-3 w-3" /> Missing Checklist Item
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {file ? (
                      <>
                        {/* Hidden replace input */}
                        <input
                          id={replaceInputId}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={e => handleReplaceFile(e, file)}
                        />

                        <button
                          onClick={() => { setSelectedDoc(file); setRotateDeg(0); setZoomScale(1); }}
                          className="p-1 px-1.5 bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-slate-800 rounded-lg text-slate-400 font-bold text-[10px] inline-flex items-center gap-0.5 transition-colors"
                          title="Preview document"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => document.getElementById(replaceInputId)?.click()}
                          disabled={isUploading}
                          className="p-1 px-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 rounded-lg text-slate-400 font-bold text-[10px] disabled:opacity-50"
                          title="Replace document"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>

                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1 px-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 rounded-lg text-slate-400 font-bold text-[10px]"
                          title="Download document"
                        >
                          <Download className="h-3 w-3" />
                        </button>

                        <button
                          onClick={() => handleDelete(file)}
                          disabled={isUploading}
                          className="p-1 px-1.5 bg-slate-100 hover:bg-rose-600 hover:text-white dark:bg-slate-800 rounded-lg text-slate-400 font-bold text-[10px] disabled:opacity-50"
                          title="Delete document"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Hidden quick-upload input */}
                        <input
                          id={quickInputId}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={e => handleQuickUpload(e, category)}
                        />
                        <button
                          disabled={uploadingCategory === category}
                          onClick={() => document.getElementById(quickInputId)?.click()}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-0.5 uppercase tracking-wide transition-colors"
                        >
                          <Upload className="h-3 w-3" />
                          {uploadingCategory === category ? "Uploading..." : "Upload"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* WIZARD UPLOADER */}
        <div className="p-5 rounded-3xl border shadow-sm dark:bg-[#141821] dark:border-[#141821] bg-white border-slate-100">
          <h4 className="text-xs font-black uppercase tracking-wider mb-3 text-slate-800 dark:text-slate-100">DMS Upload Portal File Desk</h4>

          <form onSubmit={triggerUpload} className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">Target Folder Classification</label>
              <select
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#141821] dark:border-[#141821] dark:text-slate-200 text-slate-800 bg-white border-slate-100"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">Counsellor Document Title</label>
              <input
                type="text"
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
                placeholder="e.g. My_Degree_Convocat_Copy"
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 bg-slate-50 border-slate-200 text-slate-800"
                required
              />
            </div>

            {/* DRAG & DROP ZONE */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-black block mb-0.5">Device File Attachment</label>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleWizardDrop}
                className={`border-2 border-dashed rounded-2xl p-3.5 text-center transition-all relative group ${isDragging
                    ? 'border-red-500 bg-red-500/5 scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-red-650'
                  }`}
              >
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleWizardFilePick(f); }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-1">
                  <Upload className={`h-5 w-5 transition-colors ${pendingFile ? 'text-emerald-500' : 'text-slate-400 group-hover:text-red-500'}`} />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-full block px-2">
                    {pendingFile ? pendingFile.name : 'Drag & Drop file or Click to Browse'}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {pendingFile
                      ? `${(pendingFile.size / 1024 / 1024).toFixed(1)} MB`
                      : 'Supports PDF, JPG, PNG from local system'}
                  </span>
                </div>
              </div>
              {pendingFile && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setPendingFile(null); setUploadName(''); }}
                    className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                  >
                    Clear Attachment
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isUploading || !uploadName.trim() || !pendingFile}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-extrabold text-xs py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-lg shadow-red-600/10 transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading...</span>
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

      {/* RIGHT COLUMN: DOCUMENT VIEWER */}
      <div className="xl:col-span-3">
        <div
          className="p-5 rounded-3xl border shadow-sm min-h-[830px] h-auto flex flex-col justify-between dark:bg-[#12161F] dark:border-[#12161F] bg-white border-slate-100"
          id="document-viewer-box"
        >
          {/* TOP CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-inherit">
            <div>
              <span className="text-[9px] font-mono font-black text-red-600 bg-red-600/5 px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-red-600/10 mb-1.5 block max-w-fit">
                LIVE SECURE ENCRYPTED VIEWER
              </span>
              <h5 className="font-extrabold text-xs truncate max-w-[280px] text-[#12161F] dark:text-slate-100" title={selectedDoc?.name || 'No Selected Document'}>
                {selectedDoc ? (selectedDoc.name || selectedDoc.address.split('/').pop()) : 'No Active File Loaded'}
              </h5>
              <p className="text-[10px] text-slate-400">
                {selectedDoc
                  ? `${selectedDoc.type ?? '—'} | ${getFileType(selectedDoc).toUpperCase()}`
                  : 'DMS is currently idling'}
              </p>
            </div>

            {selectedDoc && (
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <button
                  onClick={() => handleDocCycle('prev')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-[#12161F] text-slate-400 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-850 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                  Checklist: {documents.findIndex(d => d.id === selectedDoc.id) + 1} / {documents.length}
                </span>
                <button
                  onClick={() => handleDocCycle('next')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-[#12161F] text-slate-400 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* CANVAS */}
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
                  <div className="bg-red-600/10 h-12 w-12 rounded-full text-red-600 flex items-center justify-center mx-auto">
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
                  <div
                    className="transition-transform duration-200 origin-center text-xs shadow-lg max-w-full max-h-full"
                    style={{ transform: `rotate(${rotateDeg}deg) scale(${zoomScale})`, width: '100%', maxWidth: '740px' }}
                  >
                    <div className="bg-white text-slate-900 border border-slate-300 rounded-lg p-3 flex min-h-[600px] flex-col justify-between shadow-sm overflow-hidden select-none">
                      <div className="border-b border-slate-200 pb-1.5 text-center leading-snug">
                        <div className="text-[10px] font-black tracking-wider text-red-600 uppercase">SECURE DEVICE ATTACHMENT</div>
                        <div className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase">
                          {selectedDoc.type} · {getFileType(selectedDoc).toUpperCase()}
                        </div>
                      </div>

                      <div className="my-3 flex-1 flex items-center justify-center overflow-hidden max-h-[250px] bg-slate-55 rounded-lg border border-slate-100 p-1">
                        {isPdf(selectedDoc) ? (
                          <iframe
                            src={selectedDoc.address}
                            className="w-full h-[220px] rounded border-0"
                            title={selectedDoc.name}
                          />
                        ) : (
                          <img
                            src={selectedDoc.address}
                            className="max-w-full max-h-[220px] object-contain rounded"
                            alt={selectedDoc.name}
                          />
                        )}
                      </div>

                      <div className="text-[8px] font-mono text-center text-slate-400 tracking-tight">
                        FILE: {selectedDoc.name || selectedDoc.address.split('/').pop()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ACTION BAR */}
          {selectedDoc && (
            <div className="pt-3 border-t border-inherit flex items-center justify-between gap-2.5 text-slate-400">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleZoom('out')}
                  className="p-1 px-2 bg-slate-105 hover:bg-red-600 hover:text-white dark:bg-slate-850 rounded-lg text-slate-400 font-bold text-[10px] inline-flex items-center gap-0.5"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold bg-slate-105 dark:bg-slate-850 px-2 rounded-lg py-1">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => handleZoom('in')}
                  className="p-1 px-2 bg-slate-105 hover:bg-red-600 hover:text-white dark:bg-slate-850 rounded-lg text-slate-400 font-bold text-[10px] inline-flex items-center gap-0.5"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleRotate}
                  className="p-1 px-2.5 bg-slate-105 hover:bg-red-600 hover:text-white dark:bg-slate-850 rounded-lg text-slate-400 font-bold text-[10px] inline-flex items-center gap-1 transition-all"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Rotate 90°</span>
                </button>

                <button
                  onClick={() => setIsFullscreen(prev => !prev)}
                  className={`p-1 px-2.5 bg-slate-105 hover:bg-red-600 hover:text-white dark:bg-slate-850 rounded-lg text-slate-400 font-bold text-[10px] inline-flex items-center gap-1 transition-all ${isFullscreen ? 'border border-red-500 text-red-500' : ''}`}
                >
                  {isFullscreen ? (
                    <><Minimize2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Minimize</span></>
                  ) : (
                    <><Maximize2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Lightbox</span></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX */}
      {isFullscreen && selectedDoc && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col justify-between p-6">
          <div className="flex items-center justify-between text-white border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider">{selectedDoc.type} · Preview</h4>
              <p className="text-xs text-slate-400">
                {selectedDoc.name || selectedDoc.address.split('/').pop()} ({getFileType(selectedDoc).toUpperCase()})
              </p>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-full"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            <div
              className="bg-white text-slate-900 rounded-xl p-4 shadow-2xl relative transition-transform"
              style={{
                transform: `rotate(${rotateDeg}deg) scale(${zoomScale * 1.3})`,
                width: '100%',
                maxWidth: '560px',
                minHeight: '440px',
              }}
            >
              {isPdf(selectedDoc) ? (
                <iframe
                  src={selectedDoc.address}
                  className="w-full h-[400px] rounded-lg border border-slate-200"
                  title={selectedDoc.name}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <img
                    src={selectedDoc.address}
                    className="max-w-full max-h-[400px] object-contain rounded-md"
                    alt={selectedDoc.name}
                  />
                  <div className="text-center text-xs font-bold text-slate-500 mt-3">
                    {selectedDoc.name || selectedDoc.address.split('/').pop()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 border-t border-slate-850 pt-3 text-white">
            <button onClick={() => handleZoom('out')} className="p-2 bg-slate-800 rounded-lg"><ZoomOut className="h-4 w-4" /></button>
            <span className="text-xs font-mono font-bold px-3">{Math.round(zoomScale * 100)}%</span>
            <button onClick={() => handleZoom('in')} className="p-2 bg-slate-800 rounded-lg"><ZoomIn className="h-4 w-4" /></button>
            <button onClick={handleRotate} className="p-2 bg-slate-800 rounded-lg ml-2 flex items-center gap-1.5 text-xs">
              <RotateCw className="h-4 w-4" /> Rotate
            </button>
            <button
              onClick={() => handleDownload(selectedDoc)}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg ml-2 flex items-center gap-1.5 text-xs"
            >
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}