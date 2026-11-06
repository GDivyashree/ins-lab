import { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import LabBoard from './components/LabBoard';
import CardDetail from './components/CardDetail';
import Toast from './components/Toast';
import experimentsData from './data/experiments.json';
import './App.css';

const getReducedCompileCmd = (cmd, file, reducedFile) => {
  if (!cmd || !file || !reducedFile) return cmd || '';
  const baseName = file.replace(/\.c$/, '');
  const reducedBaseName = reducedFile.replace(/\.c$/, '');
  return cmd
    .replace(new RegExp(file, 'g'), reducedFile)
    .replace(new RegExp(`-o\\s+${baseName}\\b`, 'g'), `-o ${reducedBaseName}`);
};

const getReducedRunCmd = (cmd, file, reducedFile) => {
  if (!cmd || !file || !reducedFile) return cmd || '';
  const baseName = file.replace(/\.c$/, '');
  const reducedBaseName = reducedFile.replace(/\.c$/, '');
  return cmd.replace(new RegExp(baseName, 'g'), reducedBaseName);
};

const generateCombinedCode = (mode = 'new') => {
  return experimentsData
    .map((exp) => {
      const formatSinglePart = (p, isPart = false) => {
        const collegeCode = p.code || '';
        const collegeFile = p.file || '';
        const collegeCompile = p.compileCommand || exp.compileCommand || '';
        const collegeRun = p.runCommand || exp.runCommand || '';

        const reducedCode = p.reducedCode || p.code || '';
        const reducedFile = p.reducedFile || p.file || '';
        const savings = p.savings || exp.savings || '';
        const reducedCompile = getReducedCompileCmd(collegeCompile, collegeFile, reducedFile);
        const reducedRun = getReducedRunCmd(collegeRun, collegeFile, reducedFile);

        const partTag = isPart ? ` [${p.label}]` : '';

        const formatBlock = (variantLabel, file, compile, run, code, extraSavings = '') => `/* ====================================================================
   PROGRAM ${String(exp.number).padStart(2, '0')}${partTag} (${variantLabel}): ${exp.title}
   Technology: ${exp.technology}${extraSavings ? ` · ${extraSavings}` : ''}
   File: ${file}
   Compilation: ${compile}
   Execution:   ${run}
   ==================================================================== */

${code}`;

        if (mode === 'college') {
          return formatBlock('College Manual', collegeFile, collegeCompile, collegeRun, collegeCode);
        } else if (mode === 'new') {
          return formatBlock('New Reduced', reducedFile, reducedCompile, reducedRun, reducedCode, savings);
        } else {
          // 'both'
          const colBlock = formatBlock('College Manual', collegeFile, collegeCompile, collegeRun, collegeCode);
          const redBlock = formatBlock('New Reduced', reducedFile, reducedCompile, reducedRun, reducedCode, savings);
          return `${colBlock}\n\n\n${redBlock}`;
        }
      };

      if (exp.parts && exp.parts.length > 0) {
        return exp.parts
          .map((p) => formatSinglePart(p, true))
          .join('\n\n\n');
      }
      return formatSinglePart(exp, false);
    })
    .join('\n\n\n');
};

function MainLayout({ onCopyPrograms }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '500', margin: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'inline-block' }}></span>
          Information and Network Security Laboratory Exercises
        </h2>
      </div>

      {/* Home Quick Copy Bar */}
      <div className="home-copy-bar glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Copy All 5 Lab Programs
            </span>
            <span className="badge-pill badge-crypto" style={{ fontSize: '10px', padding: '1px 7px' }}>
              Instant Clipboard
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={() => onCopyPrograms('new')} 
            className="glass-btn glass-btn-primary" 
            style={{ padding: '8px 14px', fontSize: '13px' }}
            title="Copy all 5 new reduced / optimized lab programs"
          >
            <span>⚡ Copy All New</span>
          </button>
          <button 
            type="button"
            onClick={() => onCopyPrograms('college')} 
            className="glass-btn" 
            style={{ padding: '8px 14px', fontSize: '13px' }}
            title="Copy all 5 original college manual lab programs"
          >
            <span>🏛️ Copy All College</span>
          </button>
          <button 
            type="button"
            onClick={() => onCopyPrograms('both')} 
            className="glass-btn" 
            style={{ padding: '8px 14px', fontSize: '13px' }}
            title="Copy all programs in both College and New versions"
          >
            <span>📦 Copy Both</span>
          </button>
        </div>
      </div>

      <LabBoard />
    </div>
  );
}

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [copyMode, setCopyMode] = useState('new'); // 'new' | 'college' | 'both'
  const historyRef = useRef(null);
  const copyMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (historyRef.current && !historyRef.current.contains(event.target)) {
        setHistoryOpen(false);
      }
      if (copyMenuRef.current && !copyMenuRef.current.contains(event.target)) {
        setCopyMenuOpen(false);
      }
    };
    if (historyOpen || copyMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [historyOpen, copyMenuOpen]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const handleCopyPrograms = (mode = copyMode) => {
    const combinedCode = generateCombinedCode(mode);
    const toastMsgs = {
      new: 'All 5 New (Reduced) Lab Programs Copied Successfully!',
      college: 'All 5 College Lab Programs Copied Successfully!',
      both: 'All College & New Lab Programs Copied Successfully!'
    };

    navigator.clipboard.writeText(combinedCode)
      .then(() => showToast(toastMsgs[mode] || 'Programs Copied Successfully!'))
      .catch((err) => {
        console.error('Failed to copy programs:', err);
        showToast('Failed to copy programs to clipboard');
      });
  };

  return (
    <div className="app-container" style={{ padding: '20px 0' }}>
      {/* Dynamic Floating Backdrop Pink Orbs */}
      <div className="orb-container">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Main Core View Area */}
      <main className="container-box fade-in" style={{ flexGrow: '1' }}>
        {/* Top Header Navigation Bar */}
        <header className="portal-header">
          <Link to="/" className="portal-brand" title="INS Lab Portal Home">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none" style={{ display: 'block' }}>
              <path d="M24 4L7 11V22C7 32.5 14.3 42.2 24 44.5C33.7 42.2 41 32.5 41 22V11L24 4Z" fill="var(--accent-primary)" stroke="#be185d" strokeWidth="2" />
              <rect x="18" y="23" width="12" height="10" rx="2.5" fill="#ffffff" />
              <path d="M20 23V19C20 16.8 21.8 15 24 15C26.2 15 28 16.8 28 19V23" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span>INS Lab</span>
          </Link>

          <div className="portal-header-actions">
            {/* Copy All Programs Dropdown Menu */}
            <div className="copy-menu-container" ref={copyMenuRef}>
              <div className="copy-btn-group">
                <button 
                  type="button"
                  onClick={() => handleCopyPrograms(copyMode)} 
                  className="glass-btn copy-main-btn" 
                  title={`Copy all lab programs (${copyMode === 'new' ? 'New (Reduced)' : copyMode === 'college' ? 'College' : 'Both Versions'})`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>Copy All Programs</span>
                  <span className={`copy-mode-pill copy-pill-${copyMode}`}>
                    {copyMode === 'new' ? 'New' : copyMode === 'college' ? 'College' : 'Both'}
                  </span>
                </button>
                <button
                  type="button"
                  className={`glass-btn copy-chevron-btn ${copyMenuOpen ? 'active' : ''}`}
                  onClick={() => setCopyMenuOpen((prev) => !prev)}
                  title="Choose which version to copy (New, College, or Both)"
                  aria-label="Choose copy version"
                  aria-expanded={copyMenuOpen}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: copyMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>

              {copyMenuOpen && (
                <div className="copy-dropdown-card fade-in">
                  <div className="copy-dropdown-header">
                    Choose Version to Copy
                  </div>

                  <button
                    type="button"
                    className={`copy-dropdown-item ${copyMode === 'new' ? 'active-mode' : ''}`}
                    onClick={() => {
                      setCopyMode('new');
                      handleCopyPrograms('new');
                      setCopyMenuOpen(false);
                    }}
                    title="Copy all 5 new reduced / optimized lab programs"
                  >
                    <div className="copy-item-left">
                      <span className="copy-icon-circle">⚡</span>
                      <div className="copy-item-text">
                        <div className="copy-item-title-row">
                          <span className="copy-item-title">New (Reduced) Code</span>
                          <span className="badge-pill badge-crypto" style={{ fontSize: '10px', padding: '1px 6px' }}>Recommended</span>
                        </div>
                        <span className="copy-item-desc">35% – 56% less code · modern minimal syntax</span>
                      </div>
                    </div>
                    {copyMode === 'new' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`copy-dropdown-item ${copyMode === 'college' ? 'active-mode' : ''}`}
                    onClick={() => {
                      setCopyMode('college');
                      handleCopyPrograms('college');
                      setCopyMenuOpen(false);
                    }}
                    title="Copy all 5 original college manual lab programs"
                  >
                    <div className="copy-item-left">
                      <span className="copy-icon-circle">🏛️</span>
                      <div className="copy-item-text">
                        <span className="copy-item-title">College Manual Code</span>
                        <span className="copy-item-desc">Standard lab manual reference version</span>
                      </div>
                    </div>
                    {copyMode === 'college' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`copy-dropdown-item ${copyMode === 'both' ? 'active-mode' : ''}`}
                    onClick={() => {
                      setCopyMode('both');
                      handleCopyPrograms('both');
                      setCopyMenuOpen(false);
                    }}
                    title="Copy both College manual and New reduced programs"
                  >
                    <div className="copy-item-left">
                      <span className="copy-icon-circle">📦</span>
                      <div className="copy-item-text">
                        <span className="copy-item-title">Both (College + New)</span>
                        <span className="copy-item-desc">Complete bundle containing all versions</span>
                      </div>
                    </div>
                    {copyMode === 'both' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            <a 
              href="https://pclab26.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="glass-btn glass-btn-primary" 
              title="Open Parallel Computing Lab Portal"
            >
              <span>PC Lab</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>

            {/* History Dropdown */}
            <div className="history-menu-container" ref={historyRef}>
              <button 
                type="button"
                className={`glass-btn history-trigger-btn ${historyOpen ? 'active' : ''}`}
                onClick={() => setHistoryOpen((prev) => !prev)}
                title="Course Labs History (ML & Docker)"
                aria-label="Course Labs History"
                aria-expanded={historyOpen}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M12 7v5l4 2" />
                </svg>
              </button>

              {historyOpen && (
                <div className="history-dropdown-card fade-in">
                  <div className="history-dropdown-header">
                    Course Labs
                  </div>
                  <a 
                    href="https://ml26.vercel.app/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="history-dropdown-item"
                    title="Machine Learning Lab"
                    onClick={() => setHistoryOpen(false)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="history-bullet" />
                      <span>ML</span>
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </a>

                  <a 
                    href="https://devops26.vercel.app/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="history-dropdown-item"
                    title="DevOps / Docker Lab"
                    onClick={() => setHistoryOpen(false)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="history-bullet" />
                      <span>Docker</span>
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<MainLayout onCopyPrograms={handleCopyPrograms} />} />
          <Route path="/card/:id" element={<CardDetail />} />
          <Route path="/card/:id/*" element={<CardDetail />} />
          <Route path="/:id" element={<CardDetail />} />
          <Route path="*" element={
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <h2>404 - Exercise Not Found</h2>
              <Link to="/" className="glass-btn" style={{ marginTop: '20px' }}>Return to home</Link>
            </div>
          } />
        </Routes>
      </main>

      <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  );
}
