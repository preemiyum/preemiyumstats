[index_6.html](https://github.com/user-attachments/files/29508795/index_6.html)
# preemiyumstats<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preemiyum Stats | Australia's Leading Sports Betting Tips</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --green:   #39FF14;
      --green2:  #2DD60F;
      --green-bg: rgba(57,255,20,0.08);
      --green-border: rgba(57,255,20,0.25);
      --navy:    #0B0F1A;
      --navy2:   #0F1526;
      --navy3:   #141B2D;
      --navy4:   #1A2238;
      --navy5:   #202840;
      --text:    #F0F2F8;
      --muted:   #8892A8;
      --muted2:  #5A6480;
      --border:  rgba(255,255,255,0.07);
      --border2: rgba(255,255,255,0.04);
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--navy);
      color: var(--text);
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      overflow-x: hidden;
    }

    a { text-decoration: none; color: inherit; }

    /* ── NAV ── */
    nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 200;
      background: rgba(11,15,26,0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      height: 68px;
      display: flex; align-items: center;
      padding: 0 5%;
    }

    .nav-inner {
      width: 100%; max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
    }

    .nav-logo {
      display: flex; align-items: center; gap: 0.6rem;
      font-size: 1.15rem; font-weight: 800;
      letter-spacing: -0.01em;
      color: var(--text);
    }

    .nav-logo .logo-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 10px var(--green);
      flex-shrink: 0;
    }

    .nav-logo span { color: var(--green); }

    .nav-links {
      display: flex; align-items: center; gap: 2rem; list-style: none;
    }

    .nav-links a {
      font-size: 0.875rem; font-weight: 500;
      color: var(--muted);
      transition: color 0.2s;
    }

    .nav-links a:hover { color: var(--text); }

    .nav-right {
      display: flex; align-items: center; gap: 1rem;
    }

    .nav-icon-link {
      color: var(--muted); font-size: 1.1rem;
      transition: color 0.2s;
    }

    .nav-icon-link:hover { color: var(--green); }

    .btn-nav {
      background: var(--green);
      color: var(--navy);
      font-size: 0.85rem; font-weight: 700;
      padding: 0.5rem 1.25rem;
      border-radius: 6px;
      letter-spacing: 0.02em;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-nav:hover {
      background: #4fff20;
      box-shadow: 0 4px 20px rgba(57,255,20,0.35);
    }

    .burger { display: none; flex-direction: column; gap: 5px; cursor: pointer; }
    .burger span { display: block; width: 22px; height: 2px; background: var(--text); border-radius: 2px; }

    /* ── HERO ── */
    #hero {
      min-height: 100vh;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center;
      padding: 110px 5% 70px;
      position: relative;
      overflow: hidden;
    }

    .hero-bg {
      position: absolute; inset: 0; z-index: 0;
      background:
        radial-gradient(ellipse 80% 60% at 50% -10%, rgba(57,255,20,0.08) 0%, transparent 65%),
        radial-gradient(ellipse 40% 40% at 10% 80%, rgba(57,255,20,0.04) 0%, transparent 55%),
        var(--navy);
    }

    .hero-grid-lines {
      position: absolute; inset: 0; z-index: 0; opacity: 0.03;
      background-image:
        linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    #hero > * { position: relative; z-index: 1; }

    .hero-badge {
      display: inline-flex; align-items: center; gap: 0.5rem;
      font-size: 0.78rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--green);
      background: var(--green-bg);
      border: 1px solid var(--green-border);
      border-radius: 100px;
      padding: 0.4rem 1.1rem;
      margin-bottom: 2rem;
    }

    .live-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px var(--green);
      animation: blink 1.8s infinite;
    }

    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

    .hero h1 {
      font-size: clamp(2.5rem, 6.5vw, 5rem);
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.025em;
      margin-bottom: 1.5rem;
      max-width: 800px;
    }

    .hero h1 em {
      font-style: italic;
      color: var(--green);
    }

    .hero-sub {
      font-size: clamp(1rem, 1.8vw, 1.15rem);
      color: var(--muted);
      max-width: 520px;
      margin: 0 auto 2.5rem;
      font-weight: 400;
      line-height: 1.7;
    }

    .hero-actions {
      display: flex; gap: 0.875rem; justify-content: center; flex-wrap: wrap;
    }

    .btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.875rem 2rem;
      border-radius: 7px;
      font-size: 0.95rem; font-weight: 600;
      letter-spacing: 0.02em;
      transition: all 0.2s;
      cursor: pointer; border: none;
      text-decoration: none;
    }

    .btn-primary {
      background: var(--green);
      color: var(--navy);
    }

    .btn-primary:hover {
      background: #4fff20;
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(57,255,20,0.3);
    }

    .btn-ghost {
      background: transparent;
      color: var(--muted);
      border: 1px solid var(--border);
    }

    .btn-ghost:hover {
      border-color: rgba(255,255,255,0.2);
      color: var(--text);
      transform: translateY(-2px);
    }

    .hero-results-link {
      margin-top: 1.5rem;
      font-size: 0.85rem;
      color: var(--muted);
    }

    .hero-results-link a {
      color: var(--green);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    /* ── STATS BANNER ── */
    .stats-banner {
      background: var(--navy2);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .stats-inner {
      max-width: 1200px; margin: 0 auto;
      display: grid; grid-template-columns: repeat(5, 1fr);
    }

    .stat-cell {
      padding: 2rem 1.5rem;
      text-align: center;
      border-right: 1px solid var(--border);
    }

    .stat-cell:last-child { border-right: none; }

    .stat-val {
      font-size: 2rem; font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--green);
      line-height: 1;
      margin-bottom: 0.4rem;
    }

    .stat-lbl {
      font-size: 0.75rem; font-weight: 500;
      color: var(--muted); letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    /* ── SECTION BASE ── */
    section { padding: 90px 5%; }

    .section-inner { max-width: 1200px; margin: 0 auto; }

    .section-eyebrow {
      font-size: 0.75rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--green);
      margin-bottom: 0.75rem;
    }

    h2 {
      font-size: clamp(1.8rem, 3.5vw, 2.6rem);
      font-weight: 800;
      letter-spacing: -0.025em;
      line-height: 1.1;
      margin-bottom: 1rem;
    }

    .section-lead {
      color: var(--muted);
      max-width: 520px;
      font-size: 1rem;
      margin-bottom: 3rem;
      line-height: 1.75;
    }

    /* ── RESULTS DASHBOARD ── */
    #results { background: var(--navy2); }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .result-card {
      background: var(--navy3);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.75rem;
      transition: border-color 0.2s, transform 0.2s;
    }

    .result-card:hover {
      border-color: var(--green-border);
      transform: translateY(-2px);
    }

    .result-year {
      font-size: 0.75rem; font-weight: 600;
      color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase;
      margin-bottom: 1rem;
    }

    .result-profit {
      font-size: 2.2rem; font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--green);
      line-height: 1;
      margin-bottom: 0.35rem;
    }

    .result-desc {
      font-size: 0.82rem; color: var(--muted);
    }

    .result-bar {
      height: 3px; background: var(--border);
      border-radius: 2px; margin-top: 1.25rem;
      overflow: hidden;
    }

    .result-bar-fill {
      height: 100%; background: var(--green);
      border-radius: 2px;
      transition: width 1s ease;
    }

    /* ── SPORT TABS ── */
    .sport-tabs-wrap { margin-top: 3.5rem; }

    .tab-nav {
      display: flex; gap: 0; flex-wrap: wrap;
      border-bottom: 1px solid var(--border);
      margin-bottom: 2rem;
    }

    .tab-btn {
      background: transparent; border: none; cursor: pointer;
      color: var(--muted); font-family: 'Inter', sans-serif;
      font-size: 0.875rem; font-weight: 500;
      padding: 0.75rem 1.25rem;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--green); border-bottom-color: var(--green); }

    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    .perf-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .perf-table th {
      text-align: left; padding: 0.75rem 1rem;
      font-size: 0.72rem; font-weight: 600;
      color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase;
      border-bottom: 1px solid var(--border);
    }

    .perf-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border2);
      color: var(--muted);
    }

    .perf-table tr:last-child td { border-bottom: none; }
    .perf-table tr:hover td { background: rgba(255,255,255,0.02); }

    .perf-table td:first-child { color: var(--text); font-weight: 500; }
    .perf-table .profit { color: var(--green); font-weight: 700; }
    .perf-table .loss { color: #FF5252; font-weight: 700; }

    /* ── FEATURES ── */
    #features { background: var(--navy); }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
      gap: 1.25rem;
    }

    .feature-card {
      background: var(--navy3);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 2rem;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    }

    .feature-card:hover {
      border-color: var(--green-border);
      box-shadow: 0 0 30px rgba(57,255,20,0.05);
      transform: translateY(-3px);
    }

    .feature-icon {
      width: 44px; height: 44px;
      background: var(--green-bg);
      border: 1px solid var(--green-border);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem;
      margin-bottom: 1.25rem;
    }

    .feature-card h3 {
      font-size: 1.05rem; font-weight: 700;
      margin-bottom: 0.6rem;
    }

    .feature-card p {
      font-size: 0.9rem; color: var(--muted); line-height: 1.7;
    }

    /* ── PACKAGES ── */
    #packages { background: var(--navy2); }

    .pkg-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      align-items: start;
    }

    .pkg-card {
      background: var(--navy3);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2.25rem 2rem;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .pkg-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.4); }

    .pkg-card.featured {
      border-color: var(--green);
      background: linear-gradient(160deg, rgba(57,255,20,0.06) 0%, var(--navy3) 50%);
    }

    .pkg-popular-tag {
      position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
      background: var(--green); color: var(--navy);
      font-size: 0.68rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
      padding: 0.3rem 1rem; border-radius: 100px; white-space: nowrap;
    }

    .pkg-tier {
      font-size: 0.72rem; font-weight: 700;
      color: var(--muted); letter-spacing: 0.12em; text-transform: uppercase;
      margin-bottom: 0.75rem;
    }

    .pkg-price {
      font-size: 3rem; font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1;
      margin-bottom: 0.3rem;
    }

    .pkg-price sup { font-size: 1.4rem; vertical-align: super; color: var(--green); }
    .pkg-price .per { font-size: 0.95rem; color: var(--muted); font-weight: 400; }

    .pkg-tagline {
      font-size: 0.85rem; color: var(--muted);
      margin-bottom: 1.75rem; padding-bottom: 1.75rem;
      border-bottom: 1px solid var(--border);
      line-height: 1.6;
    }

    .pkg-list {
      list-style: none;
      display: flex; flex-direction: column; gap: 0.8rem;
      margin-bottom: 2rem;
    }

    .pkg-list li {
      display: flex; gap: 0.6rem; align-items: flex-start;
      font-size: 0.9rem; color: var(--muted);
    }

    .pkg-list li .tick { color: var(--green); flex-shrink: 0; margin-top: 2px; font-size: 0.85rem; }
    .pkg-list li.off { opacity: 0.35; text-decoration: line-through; }
    .pkg-list li.off .tick { color: var(--muted2); }

    .btn-pkg-primary {
      width: 100%; justify-content: center;
      background: var(--green); color: var(--navy); font-weight: 700;
    }

    .btn-pkg-primary:hover {
      background: #4fff20;
      box-shadow: 0 6px 24px rgba(57,255,20,0.3);
    }

    .btn-pkg-ghost {
      width: 100%; justify-content: center;
      background: transparent; color: var(--text);
      border: 1px solid var(--border);
    }

    .btn-pkg-ghost:hover { border-color: rgba(255,255,255,0.2); }

    .pkg-note {
      text-align: center; color: var(--muted2); font-size: 0.78rem;
      margin-top: 2rem;
    }

    .pkg-note a { color: var(--green); }

    /* ── TESTIMONIALS ── */
    #testimonials { background: var(--navy); }

    .testi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .testi-card {
      background: var(--navy3);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.75rem;
      transition: border-color 0.2s;
    }

    .testi-card:hover { border-color: var(--green-border); }

    .testi-stars { color: var(--green); letter-spacing: 2px; font-size: 0.85rem; margin-bottom: 1rem; }

    .testi-text {
      font-size: 0.92rem; line-height: 1.75;
      color: var(--text); font-style: italic;
      margin-bottom: 1.25rem;
    }

    .testi-author { display: flex; align-items: center; gap: 0.75rem; }

    .testi-ava {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--navy4);
      border: 1px solid var(--green-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; color: var(--green);
      flex-shrink: 0;
    }

    .testi-name { font-size: 0.875rem; font-weight: 600; }
    .testi-loc { font-size: 0.75rem; color: var(--muted); }

    /* ── FAQ ── */
    #faq { background: var(--navy2); }

    .faq-list {
      display: flex; flex-direction: column; gap: 0.875rem;
      max-width: 780px;
    }

    .faq-item {
      background: var(--navy3);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      transition: border-color 0.2s;
    }

    .faq-item.open { border-color: var(--green-border); }

    .faq-q {
      width: 100%; background: none; border: none; cursor: pointer;
      display: flex; justify-content: space-between; align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      text-align: left;
      font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 600;
      color: var(--text);
    }

    .faq-chevron {
      flex-shrink: 0; color: var(--green);
      font-size: 1.1rem;
      transition: transform 0.25s;
    }

    .faq-item.open .faq-chevron { transform: rotate(45deg); }

    .faq-a {
      display: none;
      padding: 0 1.5rem 1.25rem;
      font-size: 0.9rem; color: var(--muted); line-height: 1.75;
    }

    .faq-item.open .faq-a { display: block; }

    /* ── SPORTS COVERAGE ── */
    #sports { background: var(--navy); }

    .sports-pills {
      display: flex; flex-wrap: wrap; gap: 0.875rem;
    }

    .sport-pill {
      display: flex; align-items: center; gap: 0.6rem;
      background: var(--navy3);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.875rem 1.25rem;
      font-size: 0.9rem; font-weight: 500;
      color: var(--muted);
      transition: all 0.2s;
    }

    .sport-pill:hover {
      border-color: var(--green-border);
      color: var(--text);
      transform: translateY(-2px);
    }

    .sport-pill span { font-size: 1.2rem; }

    /* ── IG SECTION ── */
    #instagram { background: var(--navy2); }

    .ig-cta-box {
      background: linear-gradient(135deg, rgba(57,255,20,0.07) 0%, rgba(57,255,20,0.02) 100%);
      border: 1px solid var(--green-border);
      border-radius: 14px;
      padding: 3.5rem 2.5rem;
      text-align: center;
      max-width: 700px;
      margin: 0 auto;
    }

    .ig-icon {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 1.75rem;
    }

    .ig-cta-box h2 { margin-bottom: 0.75rem; }
    .ig-cta-box p { color: var(--muted); margin-bottom: 2rem; max-width: 440px; margin-left: auto; margin-right: auto; }

    .btn-ig {
      background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
      color: #fff; font-weight: 700;
      display: inline-flex; align-items: center; gap: 0.6rem;
    }

    .btn-ig:hover {
      opacity: 0.9;
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(220,39,67,0.35);
    }

    /* ── FOOTER ── */
    footer {
      background: var(--navy2);
      border-top: 1px solid var(--border);
    }

    .footer-inner {
      max-width: 1200px; margin: 0 auto;
      padding: 3rem 5% 2rem;
    }

    .footer-top {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 2rem;
      margin-bottom: 2.5rem;
      padding-bottom: 2.5rem;
      border-bottom: 1px solid var(--border);
    }

    .footer-brand .nav-logo { font-size: 1.05rem; margin-bottom: 0.75rem; }
    .footer-brand p { font-size: 0.82rem; color: var(--muted); max-width: 260px; line-height: 1.65; }

    .footer-links-col h4 {
      font-size: 0.72rem; font-weight: 700;
      color: var(--muted2); letter-spacing: 0.1em; text-transform: uppercase;
      margin-bottom: 1rem;
    }

    .footer-links-col ul { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
    .footer-links-col a { font-size: 0.875rem; color: var(--muted); transition: color 0.2s; }
    .footer-links-col a:hover { color: var(--green); }

    .footer-bottom {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 1rem;
      font-size: 0.78rem; color: var(--muted2);
    }

    .disclaimer-block {
      background: var(--navy);
      border-top: 1px solid var(--border);
      padding: 1.5rem 5%;
    }

    .disclaimer-block p {
      max-width: 1000px; margin: 0 auto;
      text-align: center;
      font-size: 0.7rem; color: var(--muted2); line-height: 1.65; opacity: 0.7;
    }

    .disclaimer-block a { color: var(--muted); }

    /* ── MOBILE NAV ── */
    @media (max-width: 800px) {
      .nav-links {
        display: none; position: absolute; top: 68px; left: 0; right: 0;
        flex-direction: column; gap: 0;
        background: var(--navy2);
        border-bottom: 1px solid var(--border);
        padding: 0.5rem 0;
      }
      .nav-links.open { display: flex; }
      .nav-links li { width: 100%; }
      .nav-links a { display: block; padding: 0.875rem 5%; border-radius: 0; }
      .burger { display: flex; }
      .stats-inner { grid-template-columns: repeat(3, 1fr); }
      .stat-cell:nth-child(4) { border-top: 1px solid var(--border); }
      .stat-cell:nth-child(5) { border-top: 1px solid var(--border); border-right: none; }
      .stat-cell:nth-child(3) { border-right: none; }
    }

    @media (max-width: 500px) {
      .stats-inner { grid-template-columns: repeat(2, 1fr); }
      .stat-cell:nth-child(2) { border-right: none; }
      .stat-cell:nth-child(3) { border-top: 1px solid var(--border); }
      .stat-cell:nth-child(4) { border-top: 1px solid var(--border); border-right: none; }
      .stat-cell:nth-child(5) { border-top: 1px solid var(--border); }
    }

    /* ── SCROLL ANIMATIONS ── */
    .fade-up {
      opacity: 0; transform: translateY(24px);
      transition: opacity 0.55s ease, transform 0.55s ease;
    }
    .fade-up.visible { opacity: 1; transform: translateY(0); }

    /* ── WINS STRIP ── */
    .wins-strip {
      background: var(--navy2);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      overflow: hidden;
    }
    .wins-track {
      display: flex; gap: 1.25rem;
      padding: 1rem 0;
      animation: scroll-left 30s linear infinite;
      width: max-content;
    }
    .wins-strip:hover .wins-track { animation-play-state: paused; }
    @keyframes scroll-left {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .win-chip {
      display: flex; align-items: center; gap: 0.6rem;
      background: var(--navy3);
      border: 1px solid var(--green-border);
      border-radius: 100px;
      padding: 0.45rem 1.1rem;
      white-space: nowrap;
      font-size: 0.82rem; font-weight: 600;
    }
    .win-chip .amount { color: var(--green); }
    .win-chip .sport { color: var(--muted); font-weight: 400; }

    /* ── MASONRY ── */
    .masonry {
      max-width: 1200px; margin: 0 auto;
      columns: 3; column-gap: 1.25rem;
    }
    @media (max-width: 1024px) { .masonry { columns: 2; } }
    @media (max-width: 600px) { .masonry { columns: 1; } }
    .masonry-item { break-inside: avoid; margin-bottom: 1.25rem; }

    /* ── DM CARDS ── */
    .dm-card {
      background: var(--navy3);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.5rem;
      transition: border-color 0.2s, transform 0.2s;
    }
    .dm-card:hover { border-color: var(--green-border); transform: translateY(-2px); }
    .dm-header { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 1rem; }
    .dm-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: var(--navy4); border: 1px solid var(--green-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; color: var(--green); flex-shrink: 0;
    }
    .dm-source { font-size: 0.75rem; color: var(--muted); font-weight: 500; }
    .dm-ig-icon { margin-left: auto; color: var(--muted2); }
    .dm-bubble {
      background: var(--navy4);
      border-radius: 18px 18px 18px 4px;
      padding: 0.875rem 1.1rem;
      font-size: 0.95rem; line-height: 1.6;
      color: var(--text); display: inline-block; width: 100%;
    }

    /* ── WIN CARDS ── */
    .win-card {
      background: var(--navy3);
      border: 1px solid var(--green-border);
      border-radius: 14px; padding: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .win-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(57,255,20,0.08); }
    .win-label {
      font-size: 0.7rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--green); margin-bottom: 0.75rem;
    }
    .win-bet {
      background: var(--navy4); border: 1px solid var(--border);
      border-radius: 10px; padding: 1rem 1.1rem;
      margin-bottom: 0.75rem; font-size: 0.85rem;
    }
    .win-bet-title { font-weight: 700; color: var(--text); margin-bottom: 0.2rem; }
    .win-bet-sub { color: var(--muted); font-size: 0.78rem; margin-bottom: 0.6rem; }
    .win-bet-legs { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.78rem; color: var(--muted); }
    .win-bet-legs span { display: flex; align-items: center; gap: 0.4rem; }
    .win-bet-legs span::before { content: '✓'; color: var(--green); font-weight: 700; font-size: 0.7rem; }
    .win-payout {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 0.875rem; padding-top: 0.875rem; border-top: 1px solid var(--border);
    }
    .win-payout-label { font-size: 0.78rem; color: var(--muted); }
    .win-payout-amount { font-size: 1.6rem; font-weight: 800; color: var(--green); letter-spacing: -0.03em; }
    .win-reaction { margin-top: 0.75rem; }
    .win-reaction .dm-bubble { font-size: 0.875rem; }

    /* ── BIG QUOTE ── */
    .big-quote-card {
      background: linear-gradient(135deg, rgba(57,255,20,0.07) 0%, var(--navy3) 60%);
      border: 1px solid var(--green-border);
      border-radius: 14px; padding: 2rem 1.75rem;
      transition: transform 0.2s;
    }
    .big-quote-card:hover { transform: translateY(-2px); }
    .big-quote-mark {
      font-size: 3.5rem; line-height: 1;
      color: var(--green); opacity: 0.3;
      font-family: Georgia, serif; margin-bottom: 0.5rem;
    }
    .big-quote-text {
      font-size: 1.05rem; line-height: 1.7;
      color: var(--text); font-style: italic; margin-bottom: 1.25rem;
    }
    .big-quote-source {
      font-size: 0.78rem; color: var(--muted); font-style: normal;
      display: flex; align-items: center; gap: 0.4rem;
    }
    .big-quote-source::before { content: ''; display: block; width: 20px; height: 1px; background: var(--muted2); }
  </style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="nav-inner">
    <a href="#hero" class="nav-logo">
      <div class="logo-dot"></div>
      PREEMIYUM<span>STATS</span>
    </a>
    <ul class="nav-links" id="navLinks">
      <li><a href="#results">Results</a></li>
      <li><a href="#features">Features</a></li>
      <li><a href="#packages">Packages</a></li>
      <li><a href="#member-wins">Member Wins</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
    <div class="nav-right">
      <!-- Instagram -->
      <a href="https://www.instagram.com/preemiyumstats" target="_blank" class="nav-icon-link" title="Instagram" aria-label="Instagram">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
      </a>
      <a href="https://www.instagram.com/preemiyumstats" target="_blank" class="btn-nav">Sign Up</a>
      <div class="burger" onclick="toggleNav()"><span></span><span></span><span></span></div>
    </div>
  </div>
</nav>

<!-- HERO -->
<section id="hero">
  <div class="hero-bg"></div>
  <div class="hero-grid-lines"></div>

  <div class="hero-badge"><div class="live-dot"></div>Australia's Leading Sports Betting Tips</div>
  <h1>Bet Smarter.<br><em>Win More.</em></h1>
  <p class="hero-sub">Professional sports analysis and verified betting insights from Australia's most transparent handicapper. Every pick tracked. Every unit counted.</p>
  <div class="hero-actions">
    <a href="#packages" class="btn btn-primary">View Packages →</a>
    <a href="#results" class="btn btn-ghost">Our Results ↓</a>
  </div>
  <p class="hero-results-link">Over <strong>40+ consecutive profitable months</strong> — <a href="#results">see our full record</a></p>
</section>

<!-- STATS BANNER -->
<div class="stats-banner">
  <div class="stats-inner">
    <div class="stat-cell fade-up">
      <div class="stat-val">72%</div>
      <div class="stat-lbl">Strike Rate</div>
    </div>
    <div class="stat-cell fade-up">
      <div class="stat-val">4,200+</div>
      <div class="stat-lbl">Total Picks</div>
    </div>
    <div class="stat-cell fade-up">
      <div class="stat-val">+1,683u</div>
      <div class="stat-lbl">Units Profit</div>
    </div>
    <div class="stat-cell fade-up">
      <div class="stat-val">40+</div>
      <div class="stat-lbl">Profitable Months</div>
    </div>
    <div class="stat-cell fade-up">
      <div class="stat-val">1K+</div>
      <div class="stat-lbl">Active Members</div>
    </div>
  </div>
</div>

<!-- RESULTS -->
<section id="results">
  <div class="section-inner">
    <div class="section-eyebrow">Verified Track Record</div>
    <h2>Live Performance Results</h2>
    <p class="section-lead">Full transparency. Every pick published in advance, every result logged. No cherry-picking, no excuses.</p>

    <div class="results-grid">
      <div class="result-card fade-up">
        <div class="result-year">2023 Season</div>
        <div class="result-profit">+412.11u</div>
        <div class="result-desc">Units profit &nbsp;·&nbsp; 68% strike rate</div>
        <div class="result-bar"><div class="result-bar-fill" style="width:68%"></div></div>
      </div>
      <div class="result-card fade-up">
        <div class="result-year">2024 Season</div>
        <div class="result-profit">+581.01u</div>
        <div class="result-desc">Units profit &nbsp;·&nbsp; 71% strike rate</div>
        <div class="result-bar"><div class="result-bar-fill" style="width:71%"></div></div>
      </div>
      <div class="result-card fade-up">
        <div class="result-year">2025 Season</div>
        <div class="result-profit">+462.00u</div>
        <div class="result-desc">Units profit &nbsp;·&nbsp; 74% strike rate</div>
        <div class="result-bar"><div class="result-bar-fill" style="width:74%"></div></div>
      </div>
      <div class="result-card fade-up">
        <div class="result-year">2026 (Running)</div>
        <div class="result-profit">+228.00u</div>
        <div class="result-desc">Units profit &nbsp;·&nbsp; 76% strike rate</div>
        <div class="result-bar"><div class="result-bar-fill" style="width:76%"></div></div>
      </div>
    </div>

    <!-- SPORT TABS -->
    <div class="sport-tabs-wrap fade-up">
      <div class="tab-nav">
        <button class="tab-btn active" onclick="switchTab(this,'all')">All Sports</button>
        <button class="tab-btn" onclick="switchTab(this,'afl')">AFL</button>
        <button class="tab-btn" onclick="switchTab(this,'nrl')">NRL</button>
        <button class="tab-btn" onclick="switchTab(this,'racing')">Horse Racing</button>
        <button class="tab-btn" onclick="switchTab(this,'nba')">NBA</button>
        <button class="tab-btn" onclick="switchTab(this,'soccer')">Soccer</button>
        <button class="tab-btn" onclick="switchTab(this,'tennis')">Tennis</button>
      </div>

      <!-- ALL -->
      <div class="tab-panel active" id="tab-all">
        <table class="perf-table">
          <thead><tr>
            <th>Period</th><th>Picks</th><th>W</th><th>L</th><th>Strike %</th><th>Units P/L</th>
          </tr></thead>
          <tbody>
            <tr><td>2026 YTD</td><td>590</td><td>449</td><td>141</td><td>76.1%</td><td class="profit">+228.00u</td></tr>
            <tr><td>2025</td><td>1306</td><td>966</td><td>340</td><td>74.0%</td><td class="profit">+462.00u</td></tr>
            <tr><td>2024</td><td>1342</td><td>953</td><td>389</td><td>71.0%</td><td class="profit">+581.01u</td></tr>
            <tr><td>2023</td><td>1068</td><td>726</td><td>342</td><td>68.0%</td><td class="profit">+412.11u</td></tr>
          </tbody>
        </table>
      </div>

      <!-- AFL -->
      <div class="tab-panel" id="tab-afl">
        <table class="perf-table">
          <thead><tr>
            <th>Period</th><th>Picks</th><th>W</th><th>L</th><th>Strike %</th><th>Units P/L</th>
          </tr></thead>
          <tbody>
            <tr><td>2026 YTD</td><td>64</td><td>50</td><td>14</td><td>78.1%</td><td class="profit">+46.0u</td></tr>
            <tr><td>2025</td><td>236</td><td>176</td><td>60</td><td>74.6%</td><td class="profit">+198.6u</td></tr>
            <tr><td>2024</td><td>244</td><td>174</td><td>70</td><td>71.3%</td><td class="profit">+253.9u</td></tr>
            <tr><td>2023</td><td>230</td><td>156</td><td>74</td><td>67.8%</td><td class="profit">+162.2u</td></tr>
          </tbody>
        </table>
      </div>

      <!-- NRL -->
      <div class="tab-panel" id="tab-nrl">
        <table class="perf-table">
          <thead><tr>
            <th>Period</th><th>Picks</th><th>W</th><th>L</th><th>Strike %</th><th>Units P/L</th>
          </tr></thead>
          <tbody>
            <tr><td>2026 YTD</td><td>56</td><td>40</td><td>16</td><td>71.4%</td><td class="profit">+64.0u</td></tr>
            <tr><td>2025</td><td>220</td><td>158</td><td>62</td><td>71.8%</td><td class="profit">+155.5u</td></tr>
            <tr><td>2024</td><td>228</td><td>158</td><td>70</td><td>69.3%</td><td class="profit">+167.2u</td></tr>
            <tr><td>2023</td><td>216</td><td>148</td><td>68</td><td>68.5%</td><td class="profit">+132.0u</td></tr>
          </tbody>
        </table>
      </div>

      <!-- HORSE RACING -->
      <div class="tab-panel" id="tab-racing">
        <table class="perf-table">
          <thead><tr>
            <th>Period</th><th>Picks</th><th>W</th><th>L</th><th>Strike %</th><th>Units P/L</th>
          </tr></thead>
          <tbody>
            <tr><td>2026 YTD</td><td>30</td><td>24</td><td>6</td><td>80.0%</td><td class="profit">+4.0u</td></tr>
            <tr><td>2025</td><td>216</td><td>168</td><td>48</td><td>77.8%</td><td class="profit">+87.2u</td></tr>
            <tr><td>2024</td><td>224</td><td>168</td><td>56</td><td>75.0%</td><td class="profit">+83.5u</td></tr>
            <tr><td>2023</td><td>208</td><td>148</td><td>60</td><td>71.2%</td><td class="profit">+74.4u</td></tr>
          </tbody>
        </table>
      </div>

      <!-- NBA -->
      <div class="tab-panel" id="tab-nba">
        <table class="perf-table">
          <thead><tr>
            <th>Period</th><th>Picks</th><th>W</th><th>L</th><th>Strike %</th><th>Units P/L</th>
          </tr></thead>
          <tbody>
            <tr><td>2025-26</td><td>432</td><td>329</td><td>103</td><td>76.2%</td><td class="profit">+80.0u</td></tr>
            <tr><td>2024-25</td><td>428</td><td>305</td><td>123</td><td>71.3%</td><td class="profit">+158.9u</td></tr>
            <tr><td>2023-24</td><td>414</td><td>288</td><td>126</td><td>69.6%</td><td class="profit">+152.3u</td></tr>
          </tbody>
        </table>
      </div>

      <!-- SOCCER -->
      <div class="tab-panel" id="tab-soccer">
        <table class="perf-table">
          <thead><tr>
            <th>Period</th><th>Picks</th><th>W</th><th>L</th><th>Strike %</th><th>Units P/L</th>
          </tr></thead>
          <tbody>
            <tr><td>2026 YTD</td><td>32</td><td>21</td><td>11</td><td>65.6%</td><td class="profit">+24.0u</td></tr>
            <tr><td>2025</td><td>206</td><td>138</td><td>68</td><td>67.0%</td><td class="profit">+21.6u</td></tr>
            <tr><td>2024</td><td>220</td><td>152</td><td>68</td><td>69.1%</td><td class="profit">+19.3u</td></tr>
            <tr><td>2023</td><td>210</td><td>142</td><td>68</td><td>67.6%</td><td class="profit">+16.1u</td></tr>
          </tbody>
        </table>
      <!-- TENNIS -->
      <div class="tab-panel" id="tab-tennis">
        <table class="perf-table">
          <thead><tr>
            <th>Period</th><th>Picks</th><th>W</th><th>L</th><th>Strike %</th><th>Units P/L</th>
          </tr></thead>
          <tbody>
            <tr><td>2026 YTD</td><td>48</td><td>31</td><td>17</td><td>64.6%</td><td class="profit">+10.0u</td></tr>
            <tr><td>2025</td><td>214</td><td>140</td><td>74</td><td>65.4%</td><td class="profit">+42.3u</td></tr>
            <tr><td>2024</td><td>208</td><td>136</td><td>72</td><td>65.4%</td><td class="profit">+38.7u</td></tr>
            <tr><td>2023</td><td>200</td><td>129</td><td>71</td><td>64.5%</td><td class="profit">+31.2u</td></tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section id="features">
  <div class="section-inner">
    <div class="section-eyebrow">Why Preemiyum Stats</div>
    <h2>Everything You Need to Win</h2>
    <p class="section-lead">We give our members a genuine, measurable edge — backed by data and verified results.</p>

    <div class="features-grid">
      <div class="feature-card fade-up">
        <div class="feature-icon">📈</div>
        <h3>Expert Picks Daily</h3>
        <p>Carefully researched selections across all major Australian and international sports — delivered straight to your inbox and DMs every morning.</p>
      </div>
      <div class="feature-card fade-up">
        <div class="feature-icon">📊</div>
        <h3>Verified Track Record</h3>
        <p>Every pick is logged before the game kicks off. Full transparency, publicly available. You'll always know exactly where you stand.</p>
      </div>
      <div class="feature-card fade-up">
        <div class="feature-icon">💰</div>
        <h3>Staking Strategies</h3>
        <p>We don't just give you picks — we teach you how to size your bets correctly so you protect your bank and maximise returns long-term.</p>
      </div>
      <div class="feature-card fade-up">
        <div class="feature-icon">🎁</div>
        <h3>Member Giveaways</h3>
        <p>Regular cash and merch giveaways exclusively for our active subscribers. Another way we reward loyalty in the Preemiyum community.</p>
      </div>
      <div class="feature-card fade-up">
        <div class="feature-icon">💬</div>
        <h3>Private Members Group</h3>
        <p>Join a tight-knit community of serious punters. Discuss upcoming matches, share research, and get first access to line movement alerts.</p>
      </div>
      <div class="feature-card fade-up">
        <div class="feature-icon">⚡</div>
        <h3>Instant Alerts</h3>
        <p>Real-time notifications the moment a high-value pick drops or a line moves significantly. Never miss an edge with our instant alert system.</p>
      </div>
    </div>
  </div>
</section>

<!-- SPORTS COVERAGE -->
<section id="sports">
  <div class="section-inner">
    <div class="section-eyebrow">Coverage</div>
    <h2>Sports We Cover</h2>
    <p class="section-lead">All the major Australian and international markets you care about.</p>
    <div class="sports-pills">
      <div class="sport-pill"><span>🏉</span> AFL</div>
      <div class="sport-pill"><span>🏉</span> NRL</div>
      <div class="sport-pill"><span>🐎</span> Horse Racing</div>
      <div class="sport-pill"><span>⚽</span> A-League &amp; EPL</div>
      <div class="sport-pill"><span>🏀</span> NBA</div>
      <div class="sport-pill"><span>🎾</span> Tennis</div>
      <div class="sport-pill"><span>🏏</span> Cricket</div>
      <div class="sport-pill"><span>🥊</span> Boxing / MMA</div>
      <div class="sport-pill"><span>🏈</span> NFL</div>
    </div>
  </div>
</section>

<!-- PACKAGES -->
<section id="packages">
  <div class="section-inner">
    <div class="section-eyebrow">Membership</div>
    <h2>Choose Your Plan</h2>
    <p class="section-lead">Two simple options. No fluff, no tiers. Just full access — your way.</p>

    <div class="pkg-grid" style="max-width: 760px; margin: 0 auto; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">

      <!-- MONTHLY -->
      <div class="pkg-card featured fade-up">
        <div class="pkg-popular-tag">Most Popular</div>
        <div class="pkg-tier">Monthly</div>
        <div class="pkg-price"><sup>$</sup>120<span class="per">/month</span></div>
        <p class="pkg-tagline">Full access, billed monthly. Cancel any time — no lock-in contracts.</p>
        <ul class="pkg-list">
          <li><span class="tick">✓</span> Daily tips across all sports</li>
          <li><span class="tick">✓</span> AFL, NRL, horse racing, soccer &amp; more</li>
          <li><span class="tick">✓</span> Weekly deep-dive analysis</li>
          <li><span class="tick">✓</span> Best Bet of the Week</li>
          <li><span class="tick">✓</span> Private members group access</li>
          <li><span class="tick">✓</span> Instant picks via Instagram DM</li>
          <li><span class="tick">✓</span> Cancel any time</li>
        </ul>
        <a href="https://buy.stripe.com/14AdRaaVe9td26E0zQ8IU1a" target="_blank" class="btn btn-pkg-primary" style="width:100%; justify-content:center; font-size:1rem; padding:1rem 2rem;">Subscribe Now →</a>
      </div>

      <!-- LIFETIME -->
      <div class="pkg-card fade-up" style="border-color: var(--green); background: linear-gradient(160deg, rgba(57,255,20,0.09) 0%, var(--navy3) 55%);">
        <div class="pkg-popular-tag">⚡ Best Value</div>
        <div class="pkg-tier" style="color: var(--green); margin-top: 0.5rem;">Lifetime</div>
        <div style="margin-top: 0.25rem;">
          <div style="font-size: 0.85rem; color: var(--muted); text-decoration: line-through; margin-bottom: 0.1rem;">$799</div>
          <div class="pkg-price"><sup>$</sup>599<span class="per"> one-time</span></div>
          <div style="font-size: 0.8rem; color: var(--green); font-weight: 600; margin-top: 0.2rem;">Save $200 — limited time offer</div>
        </div>
        <p class="pkg-tagline">Pay once and never think about it again. Full access to everything — for life.</p>
        <ul class="pkg-list">
          <li><span class="tick">✓</span> Everything in Monthly</li>
          <li><span class="tick">✓</span> Lifetime access — no recurring fees</li>
          <li><span class="tick">✓</span> All future upgrades included</li>
          <li><span class="tick">✓</span> Founding member status</li>
          <li><span class="tick">✓</span> Priority access to new services</li>
          <li><span class="tick">✓</span> Permanent VIP community access</li>
        </ul>
        <a href="https://buy.stripe.com/cNi28s2oIgVFdPm3M28IU1b" target="_blank" class="btn btn-pkg-primary" style="width:100%; justify-content:center; font-size:1rem; padding:1rem 2rem;">Get Lifetime Access →</a>
        <div style="margin-top:0.9rem; padding:0.75rem 1rem; background:rgba(57,255,20,0.07); border:1px solid rgba(57,255,20,0.2); border-radius:10px; text-align:center;">
          <div style="font-size:0.85rem; color:var(--green); font-weight:700;">🛡️ 30-Day Profit Guarantee</div>
          <div style="font-size:0.78rem; color:var(--muted); margin-top:0.25rem;">If you don't profit in your first 30 days, we'll refund you. No questions asked.</div>
        </div>
      </div>

    </div>

    <p class="pkg-note">All prices in AUD. Payments processed securely via Stripe.</p>
  </div>
</section>

<!-- TESTIMONIALS -->
<section id="testimonials">
  <div class="section-inner">
    <div class="section-eyebrow">Member Results</div>
    <h2>Trusted by Punters Across Australia</h2>
    <p class="section-lead">Real members. Real results. Zero fabrications.</p>

    <div class="testi-grid">
      <div class="testi-card fade-up">
        <div class="testi-stars">★★★★★</div>
        <p class="testi-text">"Been following Preemiyum Stats for over a year. The AFL analysis is genuinely next level and the transparency around results is what makes them stand out from every other service I've tried."</p>
        <div class="testi-author">
          <div class="testi-ava">JM</div>
          <div><div class="testi-name">Jake M.</div><div class="testi-loc">Melbourne, VIC · Member</div></div>
        </div>
      </div>
      <div class="testi-card fade-up">
        <div class="testi-stars">★★★★★</div>
        <p class="testi-text">"Worth every cent. I've turned my betting from a losing hobby into a profitable sideline. Horse racing tips alone covered my subscription 3x over."</p>
        <div class="testi-author">
          <div class="testi-ava">SR</div>
          <div><div class="testi-name">Samantha R.</div><div class="testi-loc">Brisbane, QLD · Member</div></div>
        </div>
      </div>
      <div class="testi-card fade-up">
        <div class="testi-stars">★★★★★</div>
        <p class="testi-text">"Love how every stat is backed up. No guesswork, pure data. The private group is super active too — easily the best community of punters I've found in Australia."</p>
        <div class="testi-author">
          <div class="testi-ava">DK</div>
          <div><div class="testi-name">Dylan K.</div><div class="testi-loc">Sydney, NSW · Member</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- MEMBER WINS -->
<section id="member-wins" style="padding: 90px 0;">
  <div style="padding: 0 5%; max-width: 1200px; margin: 0 auto 2.5rem;">
    <div class="section-eyebrow">Member Feedback</div>
    <h2>Straight from the DMs</h2>
    <p class="section-lead">Unfiltered messages and verified wins from real Preemiyum Stats members. No fabrications.</p>
  </div>

  <div class="wins-strip">
    <div class="wins-track">
      <div class="win-chip">🏉 <span class="amount">+$518.18</span> <span class="sport">NRL SGM @ 1.72</span></div>
      <div class="win-chip">🏉 <span class="amount">+$155.00</span> <span class="sport">NRL SGM @ 3.10</span></div>
      <div class="win-chip">🏉 <span class="amount">+$103.64</span> <span class="sport">NRL SGM @ 1.72</span></div>
      <div class="win-chip">⚽ <span class="amount">+$90.00</span> <span class="sport">Soccer SGM @ 1.80</span></div>
      <div class="win-chip">⚽ <span class="amount">+5 units</span> <span class="sport">FIFA Day Sweep</span></div>
      <div class="win-chip">💰 <span class="amount">+$450</span> <span class="sport">Member profit since joining</span></div>
      <div class="win-chip">💰 <span class="amount">+$4,000</span> <span class="sport">Member profit in 2 weeks</span></div>
      <div class="win-chip">⚽ <span class="amount">Mohamed Salah</span> <span class="sport">Anytime Scorer @ 2.20 ✓</span></div>
      <div class="win-chip">🎯 <span class="amount">+6 units</span> <span class="sport">Single day profit</span></div>
      <div class="win-chip">🏉 <span class="amount">+$518.18</span> <span class="sport">NRL SGM @ 1.72</span></div>
      <div class="win-chip">🏉 <span class="amount">+$155.00</span> <span class="sport">NRL SGM @ 3.10</span></div>
      <div class="win-chip">🏉 <span class="amount">+$103.64</span> <span class="sport">NRL SGM @ 1.72</span></div>
      <div class="win-chip">⚽ <span class="amount">+$90.00</span> <span class="sport">Soccer SGM @ 1.80</span></div>
      <div class="win-chip">⚽ <span class="amount">+5 units</span> <span class="sport">FIFA Day Sweep</span></div>
      <div class="win-chip">💰 <span class="amount">+$450</span> <span class="sport">Member profit since joining</span></div>
      <div class="win-chip">💰 <span class="amount">+$4,000</span> <span class="sport">Member profit in 2 weeks</span></div>
      <div class="win-chip">⚽ <span class="amount">Mohamed Salah</span> <span class="sport">Anytime Scorer @ 2.20 ✓</span></div>
      <div class="win-chip">🎯 <span class="amount">+6 units</span> <span class="sport">Single day profit</span></div>
    </div>
  </div>

  <div class="masonry" style="padding: 2.5rem 5% 0;">

    <div class="masonry-item fade-up">
      <div class="win-card">
        <div class="win-label">🏆 Lifetime Member Win · NRL Same Game Multis</div>
        <div class="win-bet">
          <div class="win-bet-title">Same Game Multi @ 3.10 · 2 Legs</div>
          <div class="win-bet-sub">NSW v QLD · Stake $50.00</div>
          <div class="win-bet-legs"><span>Leg 1 ✓</span><span>Leg 2 ✓</span></div>
          <div class="win-payout"><span class="win-payout-label">Payout</span><span class="win-payout-amount">+$155.00</span></div>
        </div>
        <div class="win-bet">
          <div class="win-bet-title">Same Game Multi @ 1.72 · 2 Legs</div>
          <div class="win-bet-sub">NSW v QLD · Stake $300.00</div>
          <div class="win-bet-legs"><span>Leg 1 ✓</span><span>Leg 2 ✓</span></div>
          <div class="win-payout"><span class="win-payout-label">Payout</span><span class="win-payout-amount">+$518.18</span></div>
        </div>
        <div class="win-reaction"><div class="dm-bubble">"Ay bro u made me win too much they promo banned me 🤣🤣"</div></div>
        <div style="margin-top:0.6rem;font-size:0.72rem;color:var(--muted);padding-left:0.25rem;">— Richie · Instagram DM</div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="big-quote-card">
        <div class="big-quote-mark">"</div>
        <p class="big-quote-text">Yo bro this has been a week. Reckon I'm up about 4 grand in the last two weeks mostly from your picks. Let's keep going! You're on fire.</p>
        <div class="big-quote-source">Instagram DM · Lifetime Member</div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="dm-card">
        <div class="dm-header">
          <div class="dm-avatar">IG</div>
          <span class="dm-source">Instagram DM · Member</span>
          <span class="dm-ig-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></span>
        </div>
        <div class="dm-bubble">"Suffering from success. Keep up the plays broski 💪"</div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="dm-card">
        <div class="dm-header"><div class="dm-avatar">IG</div><span class="dm-source">Instagram DM · Member</span></div>
        <div class="dm-bubble">"Yessir +6 units LESGOO baby crazy momentum rn"</div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="win-card">
        <div class="win-label">🏆 Lifetime Member Win · NRL</div>
        <div class="win-bet">
          <div class="win-bet-title">Same Game Multi @ 1.72 · 2 Legs</div>
          <div class="win-bet-sub">NSW v QLD · Stake $60.00</div>
          <div class="win-bet-legs"><span>Leg 1 ✓</span><span>Leg 2 ✓</span></div>
          <div class="win-payout"><span class="win-payout-label">Payout</span><span class="win-payout-amount">+$103.64</span></div>
        </div>
        <div class="win-reaction"><div class="dm-bubble">"BANNGGGGG BROTHER YOUR THE GOAT, premium eating tonight!"</div></div>
        <div style="margin-top:0.6rem;font-size:0.72rem;color:var(--muted);padding-left:0.25rem;">— Instagram DM · Lifetime Member</div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="big-quote-card">
        <div class="big-quote-mark">"</div>
        <p class="big-quote-text">I'm a first year apprentice and you've genuinely helped me out so much man, words can't explain how much you've helped me since I've joined. I'm genuinely grateful for you bro 🖤</p>
        <div class="big-quote-source">Instagram DM · Lifetime Member</div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="dm-card">
        <div class="dm-header"><div class="dm-avatar">IG</div><span class="dm-source">Instagram DM · Member</span></div>
        <div class="dm-bubble">"joined the premium yesterday and have already made my money back 🐐"</div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="win-card">
        <div class="win-label">⚽ Lifetime Member Win · FIFA World Cup</div>
        <div class="win-bet">
          <div class="win-bet-title">Same Game Multi @ 1.72 · 3 Legs</div>
          <div class="win-bet-sub">New Zealand v Egypt · Mon 22 Jun</div>
          <div class="win-bet-legs"><span>Under 4.5 Goals ✓</span><span>Over 1.5 Goals ✓</span><span>Egypt And Draw (Double Chance) ✓</span></div>
        </div>
        <div class="win-bet">
          <div class="win-bet-title">Anytime Goalscorer @ 2.20</div>
          <div class="win-bet-sub">New Zealand v Egypt</div>
          <div class="win-bet-legs"><span>Mohamed Salah — Anytime Scorer ✓</span></div>
        </div>
        <div style="margin-top:0.875rem;padding-top:0.875rem;border-top:1px solid var(--border);">
          <div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.3rem;">Day result</div>
          <div style="font-size:1.4rem;font-weight:800;color:var(--green);">+5 units 🧹</div>
          <div style="font-size:0.75rem;color:var(--muted);margin-top:0.15rem;">2 days in a row sweep</div>
        </div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="dm-card">
        <div class="dm-header"><div class="dm-avatar">IG</div><span class="dm-source">Instagram DM · Member</span></div>
        <div class="dm-bubble">"ur the goat man i was questioning a couple calls but they all hit 🔥"</div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="dm-card">
        <div class="dm-header"><div class="dm-avatar">IG</div><span class="dm-source">Instagram DM · Member</span></div>
        <div class="dm-bubble">"Bro not trying to glaze but already cashed up $450 since I've joined lol 😂😂"</div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="win-card">
        <div class="win-label">⚽ Lifetime Member Win · Soccer SGM</div>
        <div class="win-bet">
          <div class="win-bet-title">Same Game Multi @ 1.80 · 2 Legs</div>
          <div class="win-bet-sub">Argentina v Austria · Stake $50.00</div>
          <div class="win-bet-legs"><span>Over 1.5 Goals ✓</span><span>Argentina Win-Draw-Win ✓</span></div>
          <div class="win-payout"><span class="win-payout-label">Payout</span><span class="win-payout-amount">+$90.00</span></div>
        </div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="dm-card">
        <div class="dm-header"><div class="dm-avatar">IG</div><span class="dm-source">Instagram DM · Member</span></div>
        <div class="dm-bubble">"Generational run right now 🤌"</div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="dm-card">
        <div class="dm-header"><div class="dm-avatar">IG</div><span class="dm-source">Instagram DM · Member</span></div>
        <div class="dm-bubble">"the goat 🐐 what a day lesgooo 👊🤝"</div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="dm-card">
        <div class="dm-header"><div class="dm-avatar">IG</div><span class="dm-source">Story Reply · Member</span></div>
        <div class="dm-bubble">"7 MINUTES IN BEAUTY 🔥" <span style="display:block;font-size:0.75rem;color:var(--muted);margin-top:0.4rem;">Replied to a FIFA picks story — all legs hit within 7 minutes</span></div>
      </div>
    </div>

    <div class="masonry-item fade-up">
      <div class="dm-card">
        <div class="dm-header"><div class="dm-avatar">IG</div><span class="dm-source">Instagram DM · Member</span></div>
        <div class="dm-bubble">"the actual goat 🐐"</div>
      </div>
    </div>

  </div>
</section>

<!-- FAQ -->
<section id="faq">
  <div class="section-inner">
    <div class="section-eyebrow">FAQ</div>
    <h2>Common Questions</h2>
    <p class="section-lead">Everything you need to know before joining.</p>

    <div class="faq-list">
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          How do I receive the tips?
          <span class="faq-chevron">+</span>
        </button>
        <div class="faq-a">All picks are delivered via Instagram DM and email. Once you subscribe, you'll be added to our private distribution list and get same-day access to every tip we release.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          Are your results independently verified?
          <span class="faq-chevron">+</span>
        </button>
        <div class="faq-a">Yes — every pick is published publicly on our Instagram before the game starts, creating a timestamped, unalterable record. Our full results table on this page reflects exactly that record.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          What unit size do you recommend?
          <span class="faq-chevron">+</span>
        </button>
        <div class="faq-a">We recommend treating 1 unit as 1–2% of your total betting bank. This keeps your downside controlled during any losing run while still generating meaningful returns during hot streaks. Our Pro and Elite members get personalised bankroll advice.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          Can I cancel my subscription at any time?
          <span class="faq-chevron">+</span>
        </button>
        <div class="faq-a">Absolutely. There are no lock-in contracts. You can cancel any time and your access continues until the end of your current billing period. Just DM us and we'll handle it immediately.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          I'm new to sports betting — is this right for me?
          <span class="faq-chevron">+</span>
        </button>
        <div class="faq-a">Definitely. We cater to punters at all experience levels. Our Starter package is a great entry point, and all our tips come with clear explanations so you understand the reasoning behind each pick — not just the selection itself.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">
          Which bookmakers do you recommend in Australia?
          <span class="faq-chevron">+</span>
        </button>
        <div class="faq-a">Our tips work across all major Australian bookmakers including Sportsbet, TAB, Ladbrokes, Neds, and Pointsbet. We always recommend shopping around for the best available price before placing any bet.</div>
      </div>
    </div>
  </div>
</section>

<!-- INSTAGRAM CTA -->
<section id="instagram">
  <div class="section-inner">
    <div class="ig-cta-box fade-up">
      <div class="ig-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
      </div>
      <h2>Follow Us on Instagram</h2>
      <p>Get free picks, live updates, and behind-the-scenes analysis from @preemiyumstats. Join thousands of Australian punters already following along.</p>
      <a href="https://www.instagram.com/preemiyumstats" target="_blank" class="btn btn-ig">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        @preemiyumstats
      </a>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="#hero" class="nav-logo" style="margin-bottom:0.75rem; display:flex;">
          <div class="logo-dot"></div>
          PREEMIYUM<span>STATS</span>
        </a>
        <p>Australia's most transparent sports betting analysis service. Verified picks, real results, and genuine community.</p>
      </div>
      <div class="footer-links-col">
        <h4>Navigation</h4>
        <ul>
          <li><a href="#results">Results</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#packages">Packages</a></li>
          <li><a href="#member-wins">Member Wins</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
      </div>
      <div class="footer-links-col">
        <h4>Connect</h4>
        <ul>
          <li><a href="https://www.instagram.com/preemiyumstats" target="_blank">Instagram</a></li>
          <li><a href="https://www.tiktok.com/@preemiyumstats" target="_blank">TikTok</a></li>
          <li><a href="mailto:preemiyumstats@gmail.com">Email Us</a></li>
        </ul>
      </div>
      <div class="footer-links-col">
        <h4>Responsible Gambling</h4>
        <ul>
          <li><a href="https://www.gamblinghelponline.org.au" target="_blank">Gambling Help Online</a></li>
          <li><a href="tel:1800858858">1800 858 858</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Preemiyum Stats. All rights reserved.</span>
      <span>ABN · Sydney, Australia</span>
    </div>
  </div>
</footer>

<div class="disclaimer-block">
  <p>
    Gambling can be addictive — please bet responsibly. Preemiyum Stats provides analysis and commentary for informational purposes only and does not guarantee any returns. Past performance is not indicative of future results. You must be 18 years or older to gamble in Australia. If gambling is having a negative impact on your life, call Gambling Help Online on <a href="tel:1800858858">1800 858 858</a> or visit <a href="https://www.gamblinghelponline.org.au" target="_blank">gamblinghelponline.org.au</a>.
  </p>
</div>

<script>
  // Nav toggle
  function toggleNav() {
    document.getElementById('navLinks').classList.toggle('open');
  }
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open'));
  });

  // Sport tabs
  function switchTab(btn, id) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + id).classList.add('active');
  }

  // FAQ accordion
  function toggleFaq(btn) {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  }

  // Scroll fade-in
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up').forEach((el, i) => {
    el.style.transitionDelay = (i % 4 * 80) + 'ms';
    observer.observe(el);
  });
</script>
</body>
</html>
