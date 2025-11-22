import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Copy, Trash2, Link2, Share2, Clock, Type, QrCode, History, X, Check, ArrowRight, Eye } from 'lucide-react';

// --- Utility Functions ---

// Robust Base64 encoding that handles Unicode/Emojis correctly
const encodeText = (str) => {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return null;
  }
};

// Robust Base64 decoding
const decodeText = (str) => {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    return decodeURIComponent(atob(base64 + padding).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    return null;
  }
};

const calculateReadingTime = (text) => {
  const wpm = 225;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wpm);
  return `${time} min read`;
};

// --- Components ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = type === 'success' ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div className={`fixed top-5 right-5 ${colors} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 transform transition-all animate-fade-in-down z-50`}>
      {type === 'success' ? <Check size={20} /> : <X size={20} />}
      <span className="font-medium">{message}</span>
    </div>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl transition-all duration-300 ${className}`}>
    {children}
  </div>
);

export default function App() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('create'); // 'create' | 'view'
  const [darkMode, setDarkMode] = useState(true);
  const [generatedLink, setGeneratedLink] = useState('');
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Initialize Theme and Hash
  useEffect(() => {
    // Theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }

    // Load History
    const savedHistory = localStorage.getItem('textshare_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    // Check Hash
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const decoded = decodeText(hash);
        if (decoded) {
          setText(decoded);
          setMode('view');
        } else {
          showToast('Invalid or corrupted link', 'error');
          window.location.hash = '';
          setMode('create');
        }
      } else {
        setMode('create');
        setText('');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Toggle Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleGenerate = () => {
    if (!text.trim()) {
      showToast('Please enter some text first!', 'error');
      return;
    }

    const encoded = encodeText(text);
    const link = `${window.location.origin}${window.location.pathname}#${encoded}`;
    setGeneratedLink(link);
    
    // Add to history
    const newHistoryItem = {
      id: Date.now(),
      preview: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
      date: new Date().toLocaleDateString(),
      link: link
    };
    
    const updatedHistory = [newHistoryItem, ...history].slice(0, 5); // Keep last 5
    setHistory(updatedHistory);
    localStorage.setItem('textshare_history', JSON.stringify(updatedHistory));

    // Scroll to result
    showToast('Link generated successfully!');
  };

  const copyToClipboard = (content, label) => {
    navigator.clipboard.writeText(content).then(() => {
      showToast(`${label} copied to clipboard!`);
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  };

  const resetApp = () => {
    setText('');
    setGeneratedLink('');
    setMode('create');
    setShowQR(false);
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
  };

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const charCount = text.length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-indigo-50 text-slate-800'} font-sans flex flex-col relative overflow-x-hidden`}>
      
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full blur-3xl opacity-30 ${darkMode ? 'bg-purple-900' : 'bg-purple-300'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full blur-3xl opacity-30 ${darkMode ? 'bg-indigo-900' : 'bg-blue-300'}`}></div>
      </div>

      {/* Toast Container */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Navbar */}
      <nav className="w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg">
            <Share2 className="text-white" size={20} />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">
            TextShare
          </h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-3 rounded-full transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-100 shadow-sm'}`}
            title="History"
          >
            <History size={20} />
          </button>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-full transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-100 shadow-sm'}`}
            title="Toggle Theme"
          >
            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center max-w-4xl relative z-10">
        
        {/* History Drawer */}
        {showHistory && (
          <div className="w-full mb-6 animate-fade-in-down">
             <Card className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg">Recent Shares</h3>
                  <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"><X size={18} /></button>
                </div>
                {history.length === 0 ? (
                  <p className="text-slate-500 text-sm">No recent history.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex flex-col truncate mr-4">
                          <span className="text-xs text-slate-400">{item.date}</span>
                          <span className="font-medium truncate text-sm">{item.preview}</span>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(item.link, 'Link')}
                          className="p-2 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded hover:bg-violet-500/20"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
             </Card>
          </div>
        )}

        <div className="w-full grid grid-cols-1 gap-6">
          
          {/* Editor/Viewer Area */}
          <Card className="p-1 overflow-hidden">
             {/* Header Strip */}
             <div className={`px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center ${mode === 'view' ? 'bg-violet-500/5' : ''}`}>
                <div className="flex items-center gap-2">
                   {mode === 'create' ? <Type size={18} className="text-violet-500" /> : <Eye size={18} className="text-emerald-500" />}
                   <span className="font-semibold text-sm tracking-wide uppercase">{mode === 'create' ? 'Editor' : 'Reader Mode'}</span>
                </div>
                
                {mode === 'view' && (
                   <button onClick={resetApp} className="text-sm text-violet-500 font-medium hover:underline flex items-center gap-1">
                     Create New <ArrowRight size={14}/>
                   </button>
                )}
             </div>

             {/* Text Area */}
             <div className="relative">
                <textarea 
                  value={text}
                  onChange={(e) => mode === 'create' && setText(e.target.value)}
                  readOnly={mode === 'view'}
                  placeholder="Type or paste your text here to generate a secure link..."
                  className={`w-full h-80 p-6 bg-transparent border-none outline-none resize-none text-lg leading-relaxed font-mono ${mode === 'view' ? 'cursor-default' : ''}`}
                  spellCheck="false"
                />
                
                {/* Stats Overlay */}
                <div className="absolute bottom-4 right-6 flex gap-4 text-xs font-medium text-slate-400 bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 rounded-full backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700">
                   <span className="flex items-center gap-1"><Type size={12}/> {charCount} chars</span>
                   <span className="flex items-center gap-1"><Link2 size={12}/> {wordCount} words</span>
                   <span className="flex items-center gap-1"><Clock size={12}/> {calculateReadingTime(text)}</span>
                </div>
             </div>
          </Card>

          {/* Controls Area */}
          {mode === 'create' ? (
            <div className="flex flex-col md:flex-row gap-4 animate-fade-in-up">
               <button 
                  onClick={handleGenerate}
                  disabled={!text.trim()}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl font-bold shadow-lg shadow-violet-500/30 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                  <Link2 size={20} /> Generate Magic Link
               </button>
               
               <button 
                  onClick={() => setText('')}
                  disabled={!text.trim()}
                  className="px-6 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
               >
                  <Trash2 size={20} /> Clear
               </button>
            </div>
          ) : (
             <div className="flex flex-col md:flex-row gap-4 animate-fade-in-up">
               <button 
                  onClick={() => copyToClipboard(text, 'Text')}
                  className="flex-1 py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
               >
                  <Copy size={20} /> Copy Content
               </button>
            </div>
          )}

          {/* Result Section */}
          {generatedLink && mode === 'create' && (
             <div className="animate-fade-in-up">
                <Card className="p-6 border-l-4 border-violet-500">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Link Ready
                   </h3>
                   
                   <div className="flex flex-col md:flex-row gap-3 mb-4">
                      <input 
                        type="text" 
                        readOnly 
                        value={generatedLink} 
                        className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <button 
                        onClick={() => copyToClipboard(generatedLink, 'Link')}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                      >
                        <Copy size={18} /> Copy
                      </button>
                      <button 
                        onClick={() => setShowQR(!showQR)}
                        className={`px-4 py-3 rounded-lg border transition-colors flex items-center justify-center ${showQR ? 'bg-slate-200 dark:bg-slate-800 border-transparent' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                        <QrCode size={20} />
                      </button>
                   </div>

                   {showQR && (
                      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-slate-200 mb-2">
                         <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatedLink)}&color=${darkMode ? '000000' : '000000'}`} 
                            alt="QR Code" 
                            className="w-40 h-40 mb-3"
                         />
                         <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Scan to view on mobile</p>
                      </div>
                   )}

                   <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg">
                      <div className="mt-1 min-w-[16px]"><Share2 size={16} /></div>
                      <p>
                        This data is stored entirely in the link itself. No database, no tracking, no server logs. 
                        If you lose the link, the data is gone forever.
                      </p>
                   </div>
                </Card>
             </div>
          )}
        </div>
      </main>

      <footer className="p-6 text-center text-slate-400 text-sm relative z-10">
         <p>© {new Date().getFullYear()} TextShare Pro. Serverless & Secure.</p>
      </footer>
    </div>
  );
}
