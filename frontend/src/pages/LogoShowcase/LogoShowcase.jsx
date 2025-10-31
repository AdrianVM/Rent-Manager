import React from 'react';
import Logo from '../../components/Logo';
import './LogoShowcase.css';

/**
 * Logo Showcase Page
 * Demonstrates all logo variants, sizes, and usage examples
 */
function LogoShowcase() {
  return (
    <div className="logo-showcase">
      <div className="showcase-header">
        <h1>AVM Property Management Logo</h1>
        <p>Professional logo design system for the application</p>
      </div>

      {/* Size Variations */}
      <section className="showcase-section">
        <h2>Size Variations</h2>
        <div className="showcase-grid">
          <div className="showcase-item">
            <div className="showcase-box">
              <Logo size="small" showText={true} />
            </div>
            <p className="showcase-label">Small (32px)</p>
            <code>{`<Logo size="small" />`}</code>
          </div>

          <div className="showcase-item">
            <div className="showcase-box">
              <Logo size="medium" showText={true} />
            </div>
            <p className="showcase-label">Medium (48px)</p>
            <code>{`<Logo size="medium" />`}</code>
          </div>

          <div className="showcase-item">
            <div className="showcase-box">
              <Logo size="large" showText={true} />
            </div>
            <p className="showcase-label">Large (64px)</p>
            <code>{`<Logo size="large" />`}</code>
          </div>

          <div className="showcase-item">
            <div className="showcase-box">
              <Logo size="xlarge" showText={true} />
            </div>
            <p className="showcase-label">XLarge (96px)</p>
            <code>{`<Logo size="xlarge" />`}</code>
          </div>
        </div>
      </section>

      {/* Variants */}
      <section className="showcase-section">
        <h2>Logo Variants</h2>
        <div className="showcase-grid">
          <div className="showcase-item">
            <div className="showcase-box">
              <Logo variant="full" size="large" showText={true} />
            </div>
            <p className="showcase-label">Full (Icon + Text)</p>
            <code>{`<Logo variant="full" showText={true} />`}</code>
          </div>

          <div className="showcase-item">
            <div className="showcase-box">
              <Logo variant="icon-only" size="large" />
            </div>
            <p className="showcase-label">Icon Only</p>
            <code>{`<Logo variant="icon-only" />`}</code>
          </div>

          <div className="showcase-item">
            <div className="showcase-box">
              <Logo variant="text-only" showText={true} />
            </div>
            <p className="showcase-label">Text Only</p>
            <code>{`<Logo variant="text-only" showText={true} />`}</code>
          </div>

          <div className="showcase-item">
            <div className="showcase-box">
              <Logo size="large" showText={true} showSubtext={true} />
            </div>
            <p className="showcase-label">With Subtext</p>
            <code>{`<Logo showText={true} showSubtext={true} />`}</code>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="showcase-section">
        <h2>Common Use Cases</h2>

        <div className="use-case">
          <h3>Navigation Bar (Desktop)</h3>
          <div className="use-case-demo nav-demo">
            <Logo size="medium" showText={true} />
          </div>
          <code>{`<Logo size="medium" showText={true} />`}</code>
        </div>

        <div className="use-case">
          <h3>Navigation Bar (Mobile - Compact)</h3>
          <div className="use-case-demo nav-demo mobile">
            <Logo variant="icon-only" size="small" />
          </div>
          <code>{`<Logo variant="icon-only" size="small" />`}</code>
        </div>

        <div className="use-case">
          <h3>Login Page / Hero Section</h3>
          <div className="use-case-demo hero-demo">
            <Logo size="xlarge" showText={true} showSubtext={true} />
          </div>
          <code>{`<Logo size="xlarge" showText={true} showSubtext={true} />`}</code>
        </div>

        <div className="use-case">
          <h3>Footer</h3>
          <div className="use-case-demo footer-demo">
            <Logo size="medium" showText={true} showSubtext={true} />
          </div>
          <code>{`<Logo size="medium" showText={true} showSubtext={true} />`}</code>
        </div>

        <div className="use-case">
          <h3>Sidebar (Collapsed)</h3>
          <div className="use-case-demo sidebar-demo">
            <Logo variant="icon-only" size="small" />
          </div>
          <code>{`<Logo variant="icon-only" size="small" />`}</code>
        </div>
      </section>

      {/* Dark Mode */}
      <section className="showcase-section dark-section">
        <h2>Dark Mode</h2>
        <div className="showcase-grid dark-bg">
          <div className="showcase-item">
            <div className="showcase-box dark">
              <Logo size="large" showText={true} />
            </div>
            <p className="showcase-label">Full Logo</p>
          </div>

          <div className="showcase-item">
            <div className="showcase-box dark">
              <Logo variant="icon-only" size="large" />
            </div>
            <p className="showcase-label">Icon Only</p>
          </div>

          <div className="showcase-item">
            <div className="showcase-box dark">
              <Logo size="large" showText={true} showSubtext={true} />
            </div>
            <p className="showcase-label">With Subtext</p>
          </div>
        </div>
      </section>

      {/* Static SVG Files */}
      <section className="showcase-section">
        <h2>Static SVG Files</h2>
        <p className="section-description">Standalone SVG files available in <code>/public/</code></p>

        <div className="svg-files">
          <div className="svg-file-item">
            <img src="/logo-icon.svg" alt="Logo Icon" width="64" height="64" />
            <div className="svg-file-info">
              <strong>logo-icon.svg</strong>
              <span>64×64px - Icon only</span>
              <code>{`<img src="/logo-icon.svg" alt="AVM" />`}</code>
            </div>
          </div>

          <div className="svg-file-item">
            <img src="/logo-full.svg" alt="Full Logo" width="240" height="64" />
            <div className="svg-file-info">
              <strong>logo-full.svg</strong>
              <span>240×64px - Full logo with text</span>
              <code>{`<img src="/logo-full.svg" alt="AVM Property Management" />`}</code>
            </div>
          </div>

          <div className="svg-file-item">
            <img src="/logo-favicon.svg" alt="Favicon" width="32" height="32" />
            <div className="svg-file-info">
              <strong>logo-favicon.svg</strong>
              <span>32×32px - Simplified for favicon</span>
              <code>{`<link rel="icon" href="/logo-favicon.svg" />`}</code>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Colors */}
      <section className="showcase-section">
        <h2>Brand Colors</h2>
        <div className="color-palette">
          <div className="color-item">
            <div className="color-swatch" style={{ background: '#1F4E79' }}></div>
            <strong>Royal Blue</strong>
            <code>#1F4E79</code>
            <span>Primary</span>
          </div>
          <div className="color-item">
            <div className="color-swatch" style={{ background: '#1CA9A3' }}></div>
            <strong>Teal</strong>
            <code>#1CA9A3</code>
            <span>Secondary</span>
          </div>
          <div className="color-item">
            <div className="color-swatch" style={{ background: '#F28C28' }}></div>
            <strong>Orange</strong>
            <code>#F28C28</code>
            <span>Accent</span>
          </div>
        </div>

        <div className="gradient-examples">
          <div className="gradient-item">
            <div className="gradient-swatch primary-gradient"></div>
            <strong>Primary Gradient</strong>
            <code>linear-gradient(135deg, #1F4E79, #1CA9A3)</code>
          </div>
          <div className="gradient-item">
            <div className="gradient-swatch accent-gradient"></div>
            <strong>Accent Gradient</strong>
            <code>linear-gradient(135deg, #1CA9A3, #F28C28)</code>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LogoShowcase;
