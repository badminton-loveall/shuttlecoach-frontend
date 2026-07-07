import React, { useState } from 'react';
import './ModernDesignSystemPage.css';

/**
 * ModernDesignSystemPage - Pure CSS Implementation
 * Beautiful card-based design system showcase without Tailwind interference
 */

export const ModernDesignSystemPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={`modern-design-page ${isDarkMode ? 'dark' : ''}`}>
      {/* Top Navigation */}
      <nav className={`modern-nav ${isDarkMode ? 'dark' : ''}`}>
        <div className="modern-nav-container">
          <div className="modern-nav-links">
            <a href="#blocks" className="modern-nav-link">Blocks</a>
            <a href="#charts" className="modern-nav-link muted">Charts</a>
            <a href="#directory" className="modern-nav-link muted">Directory</a>
            <a href="#create" className="modern-nav-link muted">Create</a>
          </div>
          
          <div className="modern-nav-actions">
            <div className="modern-search">
              <input
                type="search"
                placeholder="Search documentation..."
                className="modern-search-input"
              />
              <svg className="modern-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="theme-toggle"
              title="Toggle theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            
            <button className="modern-btn-ghost">
              Open in VS Code
            </button>
            <button className="modern-btn-solid">
              Get Code
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="modern-main">
        <div className="modern-card-grid">
          
          {/* Card 1: Color Palette */}
          <div className={`modern-card ${isDarkMode ? 'dark' : ''}`}>
            <div className="modern-card-header">
              <h3 className="modern-card-title">Vega - Inter</h3>
              <p className="modern-card-description">
                Designers love using quirky glyphs into test phrases. This is a preview of the...
              </p>
            </div>
            <div className="modern-card-content">
              {/* Color Swatches */}
              <div className="color-swatches">
                <div className="color-swatch">
                  <div className="color-box" style={{ backgroundColor: '#1a1a1a' }}></div>
                  <span className="color-label">--darker</span>
                </div>
                <div className="color-swatch">
                  <div className="color-box" style={{ backgroundColor: '#4a5662' }}></div>
                  <span className="color-label">--forest</span>
                </div>
                <div className="color-swatch">
                  <div className="color-box" style={{ backgroundColor: '#B8E135' }}></div>
                  <span className="color-label">--primary</span>
                </div>
                <div className="color-swatch">
                  <div className="color-box" style={{ backgroundColor: '#d9f99d' }}></div>
                  <span className="color-label">--second</span>
                </div>
                <div className="color-swatch">
                  <div className="color-box" style={{ backgroundColor: '#fde68a' }}></div>
                  <span className="color-label">--tinted</span>
                </div>
                <div className="color-swatch">
                  <div className="color-box" style={{ backgroundColor: '#fef9c3' }}></div>
                  <span className="color-label">--accent</span>
                </div>
              </div>

              {/* Typography Example */}
              <div className="space-y-2">
                <p className="text-label">INHERIT - INTER</p>
                <h3 className="text-h2">Designing with rhythm and hierarchy.</h3>
                <p className="text-small">
                  A strong body style keeps long-form content readable and balances the visual weight of headings.
                </p>
                <p className="text-small">
                  Thoughtful spacing and cadence help paragraphs scan quickly without feeling dense.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button className="small-btn outline">Share Feedback</button>
              </div>
            </div>
          </div>

          {/* Card 2: Component Toolbar */}
          <div className={`modern-card ${isDarkMode ? 'dark' : ''}`}>
            <div className="modern-card-content no-header">
              {/* Icon Toolbar */}
              <div className="icon-toolbar">
                <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
              </div>

              {/* Navigation Arrows */}
              <div className="icon-toolbar">
                <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
              </div>

              {/* Button Variants */}
              <div className="space-y-3">
                <div className="button-group">
                  <button className="small-btn primary">Button</button>
                  <button className="small-btn secondary">Secondary</button>
                  <button className="small-btn outline">Outline</button>
                  <button className="small-btn ghost">Ghost</button>
                </div>

                {/* Two-factor Authentication */}
                <div className="two-factor-row">
                  <span className="two-factor-label">Two-factor authentication</span>
                  <button className="small-btn outline">Enable</button>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="modern-slider"
                />

                {/* Inputs */}
                <div className="input-with-icon">
                  <input placeholder="Name" className="modern-input" />
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <input placeholder="Message" className="modern-input" />

                {/* Badge Group */}
                <div className="button-group">
                  <span className="modern-badge">Badge</span>
                  <button className="small-btn secondary">Secondary</button>
                  <button className="small-btn outline">Outline</button>
                  <div className="toggle-switch">
                    <div className="toggle-switch-thumb"></div>
                  </div>
                </div>
              </div>

              {/* Gradient Image */}
              <div className="gradient-box" style={{ marginTop: '16px' }}></div>
            </div>
          </div>

          {/* Card 3: Environment Variables */}
          <div className={`modern-card ${isDarkMode ? 'dark' : ''}`}>
            <div className="modern-card-header">
              <h3 className="modern-card-title">Environment Variables</h3>
              <p className="modern-card-description">
                Production · 8 variables
              </p>
            </div>
            <div className="modern-card-content">
              <div className="variable-list">
                <div className="variable-item">
                  <span className="variable-name">DATABASE_URL</span>
                  <span className="variable-value">········</span>
                </div>
                <div className="variable-item">
                  <span className="variable-name">NEXT_PUBLIC_API</span>
                  <span className="variable-value">https://api.example.com</span>
                </div>
                <div className="variable-item">
                  <span className="variable-name">STRIPE_SECRET</span>
                  <span className="variable-value">········</span>
                </div>
              </div>

              <button className="small-btn outline w-full" style={{ marginTop: '12px' }}>
                Edit
              </button>
              
              <button className="small-btn primary w-full" style={{ marginTop: '8px' }}>
                Deploy
              </button>
            </div>
          </div>

          {/* Card 4: Browser Share */}
          <div className={`modern-card span-2 ${isDarkMode ? 'dark' : ''}`}>
            <div className="modern-card-content no-header">
              <div className="header-row">
                <div>
                  <h3 className="text-h3">Browser Share</h3>
                  <p className="text-small">January - June</p>
                </div>
              </div>

              {/* Simple Chart */}
              <div className="chart-container">
                <div className="chart-bar-group">
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
                    <div className="chart-bar" style={{ height: '45%', backgroundColor: 'var(--color-primary)', opacity: 0.3 }}></div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
                    <div className="chart-bar" style={{ height: '60%', backgroundColor: 'var(--color-primary)', opacity: 0.3 }}></div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
                    <div className="chart-bar" style={{ height: '85%', backgroundColor: 'var(--color-primary)' }}></div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
                    <div className="chart-bar" style={{ height: '70%', backgroundColor: 'var(--color-primary)' }}></div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
                    <div className="chart-bar" style={{ height: '50%', backgroundColor: 'var(--color-primary)', opacity: 0.3 }}></div>
                  </div>
                </div>
                <div style={{ width: '128px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="text-small">Chrome</span>
                    <span className="text-small" style={{ fontWeight: 600 }}>62%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="text-small">Firefox</span>
                    <span className="text-small" style={{ fontWeight: 600 }}>18%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="text-small">Safari</span>
                    <span className="text-small" style={{ fontWeight: 600 }}>12%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-small">Edge</span>
                    <span className="text-small" style={{ fontWeight: 600 }}>8%</span>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button className="pagination-btn active">01</button>
                <button className="pagination-btn">02</button>
              </div>
            </div>
          </div>

          {/* Card 5: Traffic Channels */}
          <div className={`modern-card ${isDarkMode ? 'dark' : ''}`}>
            <div className="modern-card-header">
              <h3 className="modern-card-title">Traffic channels</h3>
              <p className="modern-card-description">
                Monthly desktop and mobile traffic for the last six months—compare volume and mix across...
              </p>
            </div>
            <div className="modern-card-content">
              {/* Stacked Bar Chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', gap: '4px' }}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, idx) => {
                  const heights = [
                    { desktop: 64, mobile: 48 },
                    { desktop: 56, mobile: 40 },
                    { desktop: 96, mobile: 64 },
                    { desktop: 72, mobile: 56 },
                    { desktop: 80, mobile: 64 },
                    { desktop: 88, mobile: 72 }
                  ];
                  return (
                    <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div className="chart-bar" style={{ height: `${heights[idx].desktop}px`, backgroundColor: 'var(--color-primary)' }}></div>
                      <div className="chart-bar" style={{ height: `${heights[idx].mobile}px`, backgroundColor: 'var(--color-chart-3)' }}></div>
                      <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{month}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                  <span className="legend-label">Desktop</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: 'var(--color-chart-3)' }}></div>
                  <span className="legend-label">Mobile</span>
                </div>
              </div>

              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-item">
                  <p className="stat-label">DESKTOP</p>
                  <p className="stat-value">1,224</p>
                </div>
                <div className="stat-item">
                  <p className="stat-label">MOBILE</p>
                  <p className="stat-value">860</p>
                </div>
                <div className="stat-item">
                  <p className="stat-label">MIX DELTA</p>
                  <p className="stat-value" style={{ color: 'var(--color-chart-1)' }}>+42%</p>
                </div>
              </div>

              <button className="small-btn primary w-full" style={{ marginTop: '16px' }}>
                View report
              </button>
            </div>
          </div>

          {/* Card 6: Invite Team */}
          <div className={`modern-card ${isDarkMode ? 'dark' : ''}`}>
            <div className="modern-card-header">
              <h3 className="modern-card-title">Invite Team</h3>
              <p className="modern-card-description">
                Add members to your workspace
              </p>
            </div>
            <div className="modern-card-content">
              <input placeholder="email@example.com" type="email" className="modern-input" style={{ marginBottom: '12px' }} />
              <button className="small-btn primary w-full">
                Send Invite
              </button>
            </div>
          </div>

          {/* Card 7: Codespaces */}
          <div className={`modern-card ${isDarkMode ? 'dark' : ''}`}>
            <div className="modern-card-header">
              <div className="header-row">
                <div>
                  <h3 className="modern-card-title">Codespaces</h3>
                  <span className="modern-badge secondary" style={{ marginTop: '4px', display: 'inline-block' }}>Local</span>
                </div>
                <div className="header-actions">
                  <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                  <button className="icon-btn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg></button>
                </div>
              </div>
            </div>
            <div className="modern-card-content">
              <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                <p className="text-body" style={{ fontWeight: 600, marginBottom: '4px' }}>Codespaces</p>
                <p className="text-small" style={{ marginBottom: '8px' }}>Your workspaces in the cloud</p>
                <div className="icon-placeholder">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ModernDesignSystemPage;
