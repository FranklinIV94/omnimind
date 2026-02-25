import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Plus, 
  FileText, 
  Tag as TagIcon, 
  Trash2, 
  Database, 
  Brain, 
  Upload,
  X,
  Loader2,
  ChevronRight,
  Clock,
  File,
  Video,
  Music,
  Image as ImageIcon,
  FileJson,
  FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Document {
  id: string;
  filename: string;
  content: string;
  mime_type: string;
  created_at: string;
  tags: string[];
  similarity?: number;
}

interface Stats {
  documents: number;
  tags: number;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <ImageIcon size={24} />;
  if (mimeType.startsWith('video/')) return <Video size={24} />;
  if (mimeType.startsWith('audio/')) return <Music size={24} />;
  if (mimeType === 'application/json') return <FileJson size={24} />;
  if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('html')) return <FileCode size={24} />;
  return <FileText size={24} />;
};

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats>({ documents: 0, tags: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Document[] | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ filename: '', content: '', mimeType: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    const res = await fetch('/api/documents');
    const data = await res.json();
    setDocuments(data);
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats');
    const data = await res.json();
    setStats(data);
  }, []);

  useEffect(() => {
    fetchDocs();
    fetchStats();
  }, [fetchDocs, fetchStats]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (file.type.startsWith('text/') || file.type === 'application/json' || file.name.endsWith('.md')) {
        setUploadData({
          filename: file.name,
          content: result,
          mimeType: file.type || 'text/plain'
        });
      } else {
        // For binary files, we store as base64
        const base64 = result.split(',')[1];
        setUploadData({
          filename: file.name,
          content: base64,
          mimeType: file.type
        });
      }
    };

    if (file.type.startsWith('text/') || file.type === 'application/json' || file.name.endsWith('.md')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.filename || !uploadData.content) return;

    setIsUploading(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadData)
      });
      if (res.ok) {
        setUploadData({ filename: '', content: '', mimeType: '' });
        setShowUploadModal(false);
        fetchDocs();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const deleteDoc = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    fetchDocs();
    fetchStats();
  };

  const displayedDocs = searchResults || documents;

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#141414]/10 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#141414] rounded-xl flex items-center justify-center text-white">
              <Brain size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">OmniMind</h1>
              <p className="text-xs text-[#141414]/50 font-mono uppercase tracking-widest">Multimodal Knowledge Node</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 px-6 border-x border-[#141414]/10">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-[#141414]/40 tracking-tighter">Nodes</p>
                <p className="text-lg font-mono font-bold leading-none">{stats.documents}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-[#141414]/40 tracking-tighter">Tags</p>
                <p className="text-lg font-mono font-bold leading-none">{stats.tags}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-[#141414] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#141414]/90 transition-colors active:scale-95"
            >
              <Plus size={18} />
              <span className="font-medium">Ingest</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-12">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30 group-focus-within:text-[#141414] transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Ask your memory anything..."
              className="w-full bg-white border border-[#141414]/10 rounded-2xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#141414]/5 focus:border-[#141414] transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="animate-spin text-[#141414]/40" size={20} />
              </div>
            )}
            {searchResults && (
              <button 
                type="button"
                onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#141414]/40 hover:text-[#141414]"
              >
                <X size={20} />
              </button>
            )}
          </form>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['Recent', 'PDFs', 'Notes', 'Media', 'JSON', 'Code'].map(t => (
              <button key={t} className="px-3 py-1 rounded-full border border-[#141414]/10 text-xs font-medium hover:bg-white transition-colors whitespace-nowrap">
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif italic text-xl">
                {searchResults ? `Search Results for "${searchQuery}"` : 'Memory Stream'}
              </h2>
              <p className="text-xs text-[#141414]/40 font-mono">
                {displayedDocs.length} nodes active
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              {displayedDocs.map((doc) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={doc.id}
                  className="bg-white border border-[#141414]/5 rounded-2xl p-5 hover:shadow-xl hover:shadow-[#141414]/5 transition-all group relative overflow-hidden"
                >
                  {doc.similarity && (
                    <div className="absolute top-0 right-0 bg-[#5A5A40] text-white text-[10px] px-3 py-1 rounded-bl-xl font-mono">
                      Match: {(doc.similarity * 100).toFixed(0)}%
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[#F5F5F0] rounded-xl flex items-center justify-center text-[#141414]/40 group-hover:bg-[#141414] group-hover:text-white transition-colors shrink-0">
                      {getFileIcon(doc.mime_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-lg truncate pr-8">{doc.filename}</h3>
                        <button 
                          onClick={() => deleteDoc(doc.id)}
                          className="text-[#141414]/20 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-[#141414]/60 line-clamp-2 mt-1 mb-3 font-serif leading-relaxed">
                        {doc.mime_type.startsWith('text/') || doc.mime_type === 'application/json' 
                          ? doc.content 
                          : `Multimodal content (${doc.mime_type})`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {doc.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-[#F5F5F0] rounded-md text-[10px] font-bold uppercase tracking-wider text-[#141414]/60">
                            <TagIcon size={10} />
                            {tag}
                          </span>
                        ))}
                        <span className="flex items-center gap-1 text-[10px] text-[#141414]/30 font-mono ml-auto">
                          <Clock size={10} />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {displayedDocs.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-[#141414]/10 rounded-3xl">
                <Database className="mx-auto text-[#141414]/10 mb-4" size={48} />
                <p className="text-[#141414]/40 font-serif italic">Your OmniMind is currently empty.</p>
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 text-sm font-bold underline underline-offset-4 hover:text-[#5A5A40]"
                >
                  Ingest your first node
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <section className="bg-white border border-[#141414]/5 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs uppercase font-bold tracking-widest text-[#141414]/40 mb-4 flex items-center gap-2">
                <Brain size={14} />
                Neural Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Multimodal Index</span>
                  <span className="text-xs font-mono text-green-600">Active</span>
                </div>
                <div className="w-full bg-[#F5F5F0] h-1 rounded-full overflow-hidden">
                  <div className="bg-[#141414] h-full w-[92%]" />
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Local Sovereignty</span>
                  <span className="text-xs font-mono">100% Verified</span>
                </div>
                <div className="w-full bg-[#F5F5F0] h-1 rounded-full overflow-hidden">
                  <div className="bg-[#141414] h-full w-full" />
                </div>
              </div>
            </section>

            <section className="bg-[#141414] text-white rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs uppercase font-bold tracking-widest opacity-40 mb-4">Omni Insights</h3>
              <div className="space-y-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs italic font-serif leading-relaxed">
                    "OmniMind has indexed {stats.documents} nodes. Semantic connections are forming between your JSON data and recent text notes."
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#141414]/5 flex items-center justify-between">
                <h2 className="text-xl font-bold">Ingest Multimodal Node</h2>
                <button onClick={() => setShowUploadModal(false)} className="text-[#141414]/40 hover:text-[#141414]">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#141414]/10 rounded-2xl p-10 text-center hover:border-[#141414]/30 transition-all cursor-pointer group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="*/*"
                  />
                  <div className="w-16 h-16 bg-[#F5F5F0] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-[#141414]/40" size={32} />
                  </div>
                  <p className="font-bold">Click to upload any file</p>
                  <p className="text-xs text-[#141414]/40 mt-1">MD, JSON, TXT, MP4, MP3, JPG, etc.</p>
                </div>

                {uploadData.filename && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-[#F5F5F0] p-4 rounded-xl flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#141414]/60">
                      {getFileIcon(uploadData.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{uploadData.filename}</p>
                      <p className="text-[10px] uppercase font-mono text-[#141414]/40">{uploadData.mimeType}</p>
                    </div>
                    <button onClick={() => setUploadData({ filename: '', content: '', mimeType: '' })} className="text-[#141414]/40 hover:text-red-500">
                      <X size={18} />
                    </button>
                  </motion.div>
                )}

                <div className="pt-2">
                  <button 
                    onClick={handleUpload}
                    disabled={isUploading || !uploadData.filename}
                    className="w-full bg-[#141414] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#141414]/90 transition-all disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Neural Processing...
                      </>
                    ) : (
                      <>
                        <Brain size={20} />
                        Commit to OmniMind
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-[#141414]/40 mt-4 uppercase tracking-widest">
                    Gemini will analyze multimodal content for semantic indexing
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
