// Landing Page — White + Blue Medical Theme

import { useNavigate } from 'react-router-dom'
import {
  Mic, FileText, Brain, Users, BarChart3, Shield,
  CheckCircle, ArrowRight, Star, Zap, Lock,
  ChevronRight, Clock, TrendingUp, Heart,
  Stethoscope, Activity, Database, Cloud, Menu, X,
  Layers, Workflow, MessageSquare
} from 'lucide-react'
import { useState, useEffect } from 'react'

/* ─── Brand Colors ─────────────────────────────────────────── */
const BLUE       = '#2563eb'
const BLUE_DARK  = '#1d4ed8'
const BLUE_LIGHT = '#eff6ff'
const BLUE_MID   = '#3b82f6'
const NAVY       = '#1e3a8a'

/* ─── helpers ─────────────────────────────────────────────── */
const GradText = ({ children }: { children: React.ReactNode }) => (
  <span style={{ background: `linear-gradient(135deg,${NAVY} 0%,${BLUE} 50%,${BLUE_MID} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
    {children}
  </span>
)

const SectionBadge = ({ children, color = BLUE }: { children: React.ReactNode; color?: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', background: `${color}14`, color, border: `1px solid ${color}28` }}>
    {children}
  </span>
)

/* ─── Logo — matches screenshot exactly ─────────────────────── */
const Logo = ({ size = 36 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: size * 0.27,
      background: `linear-gradient(135deg,${BLUE_DARK},${BLUE})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
    }}>
      <Stethoscope size={size * 0.55} color="#fff" />
    </div>
    <span style={{ fontSize: size * 0.56, fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif", letterSpacing: '-0.02em' }}>
      ArogyaScribe
    </span>
  </div>
)

/* ─── static data ─────────────────────────────────────────── */
const FEATURES = [
  { icon: Mic,      title: 'Live Consultation Recording', desc: 'Real-time audio capture with high-fidelity AssemblyAI transcription and specialised medical terminology support.', color: BLUE,     bg: BLUE_LIGHT },
  { icon: FileText, title: 'Automated SOAP Notes',        desc: 'GPT-4 powered intelligence transforms raw transcripts into structured, clinically accurate SOAP documentation instantly.', color: '#7c3aed', bg: '#f5f3ff' },
  { icon: Brain,    title: 'AI Document Analysis',        desc: 'Upload PDFs, DOCX, or images for automated entity extraction, clinical review, and intelligent enhancement.', color: '#0891b2', bg: '#ecfeff' },
  { icon: Users,    title: 'Patient Management',          desc: 'Full-featured EHR with medical history, allergies, medications, and comprehensive visit tracking.', color: '#059669', bg: '#ecfdf5' },
  { icon: BarChart3,title: 'Intelligent Analytics',       desc: 'Real-time KPIs and productivity trends to track time saved, consultation volumes, and clinical outcomes.', color: '#d97706', bg: '#fffbeb' },
  { icon: Shield,   title: 'HIPAA & GDPR Compliant',      desc: 'Enterprise-grade security with AES-256 encryption, JWT auth, RBAC, and comprehensive audit trails.', color: '#dc2626', bg: '#fef2f2' },
  { icon: MessageSquare, title: 'Patient AI Portal',      desc: 'Patients can securely log in to view their reports and chat with an AI assistant regarding their records.', color: '#2563eb', bg: '#eff6ff' },
  { icon: Layers,   title: 'Strict Role Hierarchy',       desc: 'Distinct dashboards and capabilities for Super Admins, Organizations, Doctors, and Patients.', color: '#7c3aed', bg: '#f5f3ff' },
]

const STATS = [
  { value: '70%',  label: 'Reduction in documentation time', icon: Clock },
  { value: '500+', label: 'Medical professionals trust us',   icon: Users },
  { value: '99.9%',label: 'Platform uptime SLA',             icon: Activity },
  { value: '10K+', label: 'Concurrent users supported',      icon: TrendingUp },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Record the Consultation',   desc: 'Start a session and let ArogyaScribe capture the conversation in real-time with crystal-clear audio processing.', icon: Mic },
  { step: '02', title: 'AI Transcribes & Analyzes', desc: 'AssemblyAI transcribes every word while GPT-4 understands clinical context and medical terminology.', icon: Brain },
  { step: '03', title: 'SOAP Note Generated',       desc: 'A structured, accurate SOAP note is ready for your review within seconds — fully editable and exportable.', icon: FileText },
  { step: '04', title: 'Export & Distribute',       desc: 'Export to PDF or DOCX, send via email, or integrate with your existing EHR system seamlessly.', icon: Cloud },
]

const TESTIMONIALS = [
  { name: 'Dr. Sarah Mitchell', role: 'General Practitioner', org: 'City Health Clinic',         text: 'ArogyaScribe has completely transformed my workflow. I spend 70% less time on documentation and more time with my patients.', rating: 5 },
  { name: 'Dr. Raj Patel',      role: 'Cardiologist',         org: 'Metro Heart Institute',      text: 'The AI analysis feature is remarkable. It catches details I might miss and structures them perfectly into SOAP format.', rating: 5 },
  { name: 'Dr. Emily Chen',     role: 'Pediatrician',         org: "Children's Wellness Center", text: 'HIPAA compliance was our biggest concern. ArogyaScribe handles it flawlessly with enterprise-grade security.', rating: 5 },
]

const TECH_STACK = [
  { name: 'React 18',    icon: '⚛️' }, { name: 'FastAPI',      icon: '⚡' },
  { name: 'GPT-4',       icon: '🤖' }, { name: 'AssemblyAI',   icon: '🎙️' },
  { name: 'PostgreSQL',  icon: '🐘' }, { name: 'AWS',          icon: '☁️' },
]

const NAV_LINKS = ['Features', 'Workflows', 'How It Works', 'Security']

const WORKFLOWS = [
  {
    id: 'rag',
    title: 'Clinical RAG Engine',
    desc: 'Retrieval-Augmented Generation using pgvector. Analyzes patient history and uploaded PDFs/images to ground AI decisions in factual medical records.',
    color: '#0891b2'
  },
  {
    id: 'radiology',
    title: 'Radiology AI',
    desc: 'Specialized DICOM/Image viewer that leverages GPT-4o Vision to instantly analyze X-Rays and MRI scans to aid diagnostic assessment.',
    color: '#7c3aed'
  },
  {
    id: 'voice',
    title: 'Live Voice Dictation',
    desc: 'Real-time websocket connection to AssemblyAI for high-fidelity medical transcription, capturing doctor-patient dialogue effortlessly.',
    color: BLUE
  },
  {
    id: 'ehr',
    title: 'Hierarchical EHR',
    desc: 'Organizations manage doctors, doctors manage patients, and patients can access their own secure dashboard to review clinical outcomes.',
    color: '#059669'
  }
]

/* ─── component ─────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif", background: '#f4f7fb', color: '#1e3a5f', overflowX: 'hidden' }}>

      {/* ══════════ NAVBAR ══════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid #dce6f5' : '1px solid transparent',
        padding: '0 clamp(16px,5vw,80px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 68,
        boxShadow: scrolled ? '0 2px 16px rgba(30,58,138,0.08)' : 'none',
        transition: 'all 0.25s ease',
      }}>
        <Logo size={36} />

        {/* Desktop nav links */}
        <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              style={{ fontSize: 14, fontWeight: 500, color: '#4a6080', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = BLUE)}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a6080')}
            >{l}</a>
          ))}
        </div>

        {/* Desktop CTA buttons */}
        <div className="lp-nav-cta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/login')}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #dce6f5', background: 'transparent', color: '#1e3a5f', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BLUE; (e.currentTarget as HTMLButtonElement).style.color = BLUE }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#dce6f5'; (e.currentTarget as HTMLButtonElement).style.color = '#1e3a5f' }}
          >Log In</button>
          <button onClick={() => navigate('/login')}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg,${BLUE_DARK},${BLUE})`, color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.15s', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(37,99,235,0.4)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)' }}
          >Sign Up Free</button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lp-hamburger"
          onClick={() => setMobileMenuOpen(o => !o)}
          style={{ display: 'none', padding: 8, borderRadius: 8, border: '1.5px solid #dce6f5', background: 'transparent', cursor: 'pointer', color: '#1e3a5f' }}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', top: 68, left: 0, right: 0, zIndex: 99,
          background: '#fff', borderBottom: '1px solid #dce6f5',
          padding: '16px 24px 20px',
          boxShadow: '0 8px 24px rgba(30,58,138,0.12)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: '12px 0', fontSize: 15, fontWeight: 500, color: '#1e3a5f', textDecoration: 'none', borderBottom: '1px solid #f4f7fb' }}
            >{l}</a>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #dce6f5', background: 'transparent', color: '#1e3a5f', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >Log In</button>
            <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg,${BLUE_DARK},${BLUE})`, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >Sign Up Free</button>
          </div>
        </div>
      )}

      {/* ══════════ HERO ══════════ */}
      <section style={{
        minHeight: '100vh',
        marginTop: 68,
        background: 'linear-gradient(160deg,#ffffff 0%,#eff6ff 45%,#dbeafe 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(40px,6vw,80px) clamp(16px,5vw,80px)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(29,78,216,0.05) 0%,transparent 70%)', pointerEvents: 'none' }} />
        {/* Animated blue ring */}
        <div style={{ position: 'absolute', top: '15%', left: '5%', width: 160, height: 160, borderRadius: '50%', border: '1.5px solid rgba(37,99,235,0.12)', pointerEvents: 'none', animation: 'float 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '8%', width: 100, height: 100, borderRadius: '50%', border: '1.5px solid rgba(37,99,235,0.1)', pointerEvents: 'none', animation: 'float 8s ease-in-out infinite reverse' }} />

        <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 22, animation: 'slideUp 0.5s ease both' }}>
            <SectionBadge color={BLUE}><Zap size={11} /> AI-Powered Healthcare Documentation</SectionBadge>
          </div>

          <h1 style={{ fontSize: 'clamp(32px,6vw,72px)', fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif", fontWeight: 800, color: '#0f172a', lineHeight: 1.08, marginBottom: 24, letterSpacing: '-0.03em', animation: 'slideUp 0.5s 0.08s ease both' }}>
            Clinical Documentation,<br />
            <GradText>Reimagined with AI</GradText>
          </h1>

          <p style={{ fontSize: 'clamp(14px,2vw,18px)', color: '#4a6080', maxWidth: 600, margin: '0 auto 44px', lineHeight: 1.8, animation: 'slideUp 0.5s 0.16s ease both' }}>
            ArogyaScribe automates SOAP note generation, transcribes consultations in real-time, and analyses medical documents — so you can focus entirely on patient care.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60, animation: 'slideUp 0.5s 0.24s ease both' }}>
            <a href="#features"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 34px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${BLUE_DARK},${BLUE})`, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 24px rgba(37,99,235,0.35)', transition: 'all 0.2s', fontFamily: 'inherit', textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 12px 36px rgba(37,99,235,0.45)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 24px rgba(37,99,235,0.35)' }}
            >
              Explore Platform <ChevronRight size={16} />
            </a>
            <a href="#how-it-works"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 10, border: '1.5px solid #dce6f5', background: '#fff', color: '#1e3a5f', fontSize: 15, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', textDecoration: 'none', boxShadow: '0 2px 8px rgba(30,58,138,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = BLUE; (e.currentTarget as HTMLAnchorElement).style.color = BLUE }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#dce6f5'; (e.currentTarget as HTMLAnchorElement).style.color = '#1e3a5f' }}
            >
              Clinical Workflow
            </a>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div style={{ width: '100%', maxWidth: 920, position: 'relative', animation: 'slideUp 0.6s 0.32s ease both' }}>
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #dce6f5', boxShadow: '0 24px 80px rgba(30,58,138,0.14)', overflow: 'hidden' }}>
            {/* Browser bar */}
            <div style={{ background: '#f8faff', borderBottom: '1px solid #dce6f5', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fca5a5' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fcd34d' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#6ee7b7' }} />
              <div style={{ flex: 1, background: '#dce6f5', borderRadius: 6, height: 22, marginLeft: 8, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                <span style={{ fontSize: 11, color: '#8fa5c0' }}>app.arogyascribe.ai/dashboard</span>
              </div>
            </div>
            {/* Stat cards */}
            <div style={{ padding: 20, background: '#f4f7fb', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
              {[
                { label: 'Consultations Today', value: '24',  color: BLUE,     icon: '🩺' },
                { label: 'SOAP Notes Generated',value: '24',  color: '#7c3aed', icon: '📋' },
                { label: 'Time Saved',           value: '3.2h',color: '#059669', icon: '⏱️' },
                { label: 'Patients Seen',        value: '18',  color: '#d97706', icon: '👥' },
              ].map(c => (
                <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #dce6f5', boxShadow: '0 2px 8px rgba(30,58,138,0.04)' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 10.5, color: '#8fa5c0', marginTop: 2 }}>{c.label}</div>
                </div>
              ))}
            </div>
            {/* SOAP preview */}
            <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
              {[
                { label: 'S — Subjective', color: BLUE,     text: 'Patient reports persistent headache for 3 days, rated 7/10 severity...' },
                { label: 'O — Objective',  color: '#059669', text: 'BP: 128/82 mmHg, HR: 76 bpm, Temp: 98.6°F, RR: 16/min...' },
                { label: 'A — Assessment', color: '#dc2626', text: 'Tension-type headache, likely stress-induced. Rule out hypertension...' },
                { label: 'P — Plan',       color: '#7c3aed', text: 'Prescribe ibuprofen 400mg TID. Follow-up in 7 days if no improvement...' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: 12, border: `1px solid ${s.color}22`, borderTop: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: s.color, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: '#4a6080', lineHeight: 1.5 }}>{s.text}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Floating badge */}
          <div className="lp-float-badge" style={{ position: 'absolute', top: -14, right: -14, background: '#fff', borderRadius: 12, padding: '9px 14px', boxShadow: '0 8px 28px rgba(30,58,138,0.14)', border: '1px solid #dce6f5', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 4px rgba(16,185,129,0.2)', animation: 'med-pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>AI Generating SOAP Note…</span>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section style={{ background: `linear-gradient(135deg,${NAVY} 0%,${BLUE_DARK} 50%,${BLUE} 100%)`, padding: 'clamp(40px,6vw,72px) clamp(16px,5vw,80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 32 }}>
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float 3.5s ease-in-out infinite' }}>
                  <Icon size={24} color="#fff" />
                </div>
              </div>
              <div style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" style={{ padding: 'clamp(56px,8vw,100px) clamp(16px,5vw,80px)', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <SectionBadge color={BLUE}><Star size={11} /> Core Features</SectionBadge>
            <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, color: '#0f172a', marginTop: 16, marginBottom: 14, letterSpacing: '-0.03em' }}>
              Everything You Need to <GradText>Document Smarter</GradText>
            </h2>
            <p style={{ fontSize: 15, color: '#4a6080', maxWidth: 540, margin: '0 auto', lineHeight: 1.8 }}>
              From real-time transcription to AI-powered analysis, ArogyaScribe covers every step of your clinical documentation workflow.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 22 }}>
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <div key={title}
                className={`card-enter-${Math.min(i + 1, 4)}`}
                style={{ background: '#fff', border: '1px solid #dce6f5', borderRadius: 16, padding: 28, transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 36px rgba(30,58,138,0.10)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLDivElement).style.borderColor = color + '50' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#dce6f5' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, border: `1px solid ${color}20` }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.01em' }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: '#4a6080', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ WORKFLOWS & ARCHITECTURE ══════════ */}
      <section id="workflows" style={{ padding: 'clamp(56px,8vw,100px) clamp(16px,5vw,80px)', background: '#f8faff', borderTop: '1px solid #dce6f5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <SectionBadge color={BLUE_DARK}><Workflow size={11} /> Project Architecture</SectionBadge>
            <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, color: '#0f172a', marginTop: 16, marginBottom: 14, letterSpacing: '-0.03em' }}>
              Advanced Medical <GradText>AI Workflows</GradText>
            </h2>
            <p style={{ fontSize: 15, color: '#4a6080', maxWidth: 600, margin: '0 auto', lineHeight: 1.8 }}>
              A fully native architecture running seamlessly on our FastAPI backend—no third-party automation tools needed.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
            {WORKFLOWS.map((wf) => (
              <div key={wf.id} style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #dce6f5', boxShadow: '0 4px 20px rgba(30,58,138,0.04)', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(30,58,138,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(30,58,138,0.04)' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: wf.color }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>{wf.title}</h3>
                <p style={{ fontSize: 14, color: '#4a6080', lineHeight: 1.7 }}>{wf.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works" style={{ padding: 'clamp(56px,8vw,100px) clamp(16px,5vw,80px)', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <SectionBadge color={BLUE_MID}><Zap size={11} /> Simple Workflow</SectionBadge>
            <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, color: '#0f172a', marginTop: 16, marginBottom: 14, letterSpacing: '-0.03em' }}>
              From Consultation to <GradText>Completed Note</GradText>
            </h2>
            <p style={{ fontSize: 15, color: '#4a6080', maxWidth: 500, margin: '0 auto', lineHeight: 1.8 }}>
              Four simple steps to eliminate documentation burden and reclaim hours of your day.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 22, position: 'relative' }}>
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, i) => (
              <div key={step} style={{ position: 'relative' }}>
                <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #dce6f5', height: '100%', boxShadow: '0 2px 10px rgba(30,58,138,0.06)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(30,58,138,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(30,58,138,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 13, background: `linear-gradient(135deg,${BLUE_DARK},${BLUE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
                      <Icon size={20} color="#fff" />
                    </div>
                    <span style={{ fontSize: 30, fontWeight: 800, color: '#dce6f5', letterSpacing: '-0.04em' }}>{step}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.01em' }}>{title}</h3>
                  <p style={{ fontSize: 13, color: '#4a6080', lineHeight: 1.7 }}>{desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="lp-how-arrow" style={{ position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
                    <ChevronRight size={20} color={BLUE} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ AI ANALYSIS SPOTLIGHT ══════════ */}
      <section style={{ padding: 'clamp(56px,8vw,100px) clamp(16px,5vw,80px)', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 52, alignItems: 'center' }}>
          <div>
            <SectionBadge color="#7c3aed"><Brain size={11} /> AI Document Analysis</SectionBadge>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, color: '#0f172a', marginTop: 16, marginBottom: 18, lineHeight: 1.15, letterSpacing: '-0.03em' }}>
              Upload Any Medical Document.<br /><GradText>AI Does the Rest.</GradText>
            </h2>
            <p style={{ fontSize: 14.5, color: '#4a6080', lineHeight: 1.8, marginBottom: 26 }}>
              Upload PDFs, DOCX files, or scanned images of medical records. ArogyaScribe's GPT-4 pipeline extracts clinical entities, generates structured SOAP notes, and provides a side-by-side comparison with your existing records.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Supports PDF, DOCX, and image formats (up to 50 MB)',
                'Automated OCR for scanned documents',
                'Key entity extraction (medications, diagnoses, vitals)',
                'Side-by-side diff comparison with existing notes',
                'One-click approval to create consultation record',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle size={16} color={BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, color: '#1e3a5f' }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/login')}
              style={{ marginTop: 30, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${BLUE_DARK},${BLUE})`, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.3)', transition: 'all 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(37,99,235,0.42)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(37,99,235,0.3)' }}
            >
              Try AI Analysis <ArrowRight size={15} />
            </button>
          </div>

          {/* Mockup card */}
          <div style={{ background: '#f8faff', borderRadius: 20, padding: 22, border: '1px solid #dce6f5', boxShadow: '0 8px 32px rgba(30,58,138,0.08)' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #dce6f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: BLUE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${BLUE}20` }}>
                  <Brain size={17} color={BLUE} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>AI Analysis Complete</div>
                  <div style={{ fontSize: 10.5, color: '#8fa5c0' }}>patient_report_2026.pdf</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', whiteSpace: 'nowrap' }}>98% Confidence</span>
              </div>
              {[
                { label: 'Medications Found',   value: '4 items',      color: BLUE },
                { label: 'Diagnoses Extracted', value: '2 conditions', color: '#dc2626' },
                { label: 'Vitals Detected',     value: '6 readings',   color: '#059669' },
                { label: 'Follow-up Required',  value: 'Yes — 7 days', color: '#d97706' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f4f7fb' }}>
                  <span style={{ fontSize: 12, color: '#4a6080' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: `1px solid ${BLUE}22`, borderTop: `3px solid ${BLUE}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Original</div>
                <div style={{ fontSize: 10.5, color: '#8fa5c0', lineHeight: 1.5 }}>Patient c/o chest pain radiating to left arm…</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #6ee7b744', borderTop: '3px solid #059669' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>AI Enhanced</div>
                <div style={{ fontSize: 10.5, color: '#1e3a5f', lineHeight: 1.5 }}>Patient presents with acute chest pain (8/10) radiating to left arm, onset 2h ago…</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SECURITY ══════════ */}
      <section id="security" style={{ padding: 'clamp(56px,8vw,100px) clamp(16px,5vw,80px)', background: `linear-gradient(160deg,${NAVY} 0%,${BLUE_DARK} 60%,${BLUE} 100%)`, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <SectionBadge color="#93c5fd"><Shield size={11} /> Enterprise Security</SectionBadge>
            <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, color: '#fff', marginTop: 16, marginBottom: 14, letterSpacing: '-0.03em' }}>
              Built for Healthcare's <span style={{ color: '#93c5fd' }}>Strictest Standards</span>
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
              Every layer of ArogyaScribe is designed with HIPAA, GDPR, and SOC 2 compliance in mind — from encryption to audit trails.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 18 }}>
            {[
              { icon: Lock,     title: 'AES-256 Encryption', desc: 'All PHI encrypted at rest and in transit using military-grade AES-256-GCM with key rotation every 90 days.', color: '#93c5fd' },
              { icon: Shield,   title: 'HIPAA Compliant',    desc: 'Full administrative, physical, and technical safeguards. BAAs available for all third-party integrations.', color: '#6ee7b7' },
              { icon: Database, title: 'Audit Trail',        desc: 'Immutable event logging for every clinical and administrative action with tamper-proof timestamps.', color: '#c4b5fd' },
              { icon: Lock,     title: 'GDPR Ready',         desc: 'Full data subject rights — access, rectification, erasure, and portability on demand.', color: '#6ee7b7' },
              { icon: Activity, title: '99.9% Uptime SLA',  desc: 'Multi-AZ AWS deployment with auto-scaling, blue-green deployments, and 15-minute MTTR guarantee.', color: '#fca5a5' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 24, transition: 'all 0.2s', backdropFilter: 'blur(8px)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLDivElement).style.borderColor = color + '50'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color={color} />
                </div>
                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section style={{ padding: 'clamp(56px,8vw,100px) clamp(16px,5vw,80px)', background: '#f4f7fb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <SectionBadge color="#d97706"><Heart size={11} /> Trusted by Doctors</SectionBadge>
            <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, color: '#0f172a', marginTop: 16, letterSpacing: '-0.03em' }}>
              What Healthcare Professionals <GradText>Are Saying</GradText>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 22 }}>
            {TESTIMONIALS.map(({ name, role, org, text, rating }) => (
              <div key={name} style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #dce6f5', boxShadow: '0 4px 16px rgba(30,58,138,0.06)', display: 'flex', flexDirection: 'column', gap: 16, transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 32px rgba(30,58,138,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(30,58,138,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={13} color="#d97706" fill="#d97706" />
                  ))}
                </div>
                <p style={{ fontSize: 13.5, color: '#1e3a5f', lineHeight: 1.75, fontStyle: 'italic', flex: 1 }}>"{text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${BLUE_DARK},${BLUE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {name.charAt(3)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{name}</div>
                    <div style={{ fontSize: 11.5, color: '#8fa5c0' }}>{role} · {org}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TECH STACK ══════════ */}
      <section style={{ padding: 'clamp(36px,5vw,56px) clamp(16px,5vw,80px)', background: '#fff', borderTop: '1px solid #dce6f5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: '#8fa5c0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 22 }}>Powered by Industry-Leading Technology</p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
            {TECH_STACK.map(({ name, icon }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#f8faff', borderRadius: 10, border: '1px solid #dce6f5', fontSize: 13, fontWeight: 600, color: '#1e3a5f', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = BLUE_LIGHT; (e.currentTarget as HTMLDivElement).style.borderColor = BLUE + '44'; (e.currentTarget as HTMLDivElement).style.color = BLUE }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#f8faff'; (e.currentTarget as HTMLDivElement).style.borderColor = '#dce6f5'; (e.currentTarget as HTMLDivElement).style.color = '#1e3a5f' }}
              >
                <span style={{ fontSize: 17 }}>{icon}</span> {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section style={{ padding: 'clamp(56px,8vw,100px) clamp(16px,5vw,80px)', background: `linear-gradient(135deg,${NAVY} 0%,${BLUE_DARK} 50%,${BLUE} 100%)`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 800, color: '#fff', marginBottom: 18, lineHeight: 1.15, letterSpacing: '-0.03em' }}>
            Ready to Transform Your<br />Clinical Documentation?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: 36, lineHeight: 1.8 }}>
            Join 500+ healthcare professionals who save hours every day with ArogyaScribe.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 34px', borderRadius: 10, border: 'none', background: '#fff', color: BLUE_DARK, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,0.2)', transition: 'all 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 36px rgba(0,0,0,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)' }}
            >
              Sign Up Free <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/login')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ background: '#0f172a', color: '#8fa5c0', padding: 'clamp(36px,5vw,56px) clamp(16px,5vw,80px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 36, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${BLUE_DARK},${BLUE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Stethoscope size={15} color="#fff" />
                </div>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#f0f6fc', fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.02em' }}>ArogyaScribe</span>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.75, color: '#4a6080', maxWidth: 200 }}>
                AI-powered clinical documentation platform for healthcare professionals.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#f0f6fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Product</h4>
              {['Features', 'How It Works', 'Security'].map(l => (
                <div key={l} style={{ marginBottom: 9 }}>
                  <a href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                    style={{ fontSize: 13, color: '#4a6080', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#93c5fd')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4a6080')}
                  >{l}</a>
                </div>
              ))}
            </div>

            {/* Account */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#f0f6fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Account</h4>
              {[
                { label: 'Log In',  action: () => navigate('/login') },
                { label: 'Sign Up', action: () => navigate('/login') },
              ].map(({ label, action }) => (
                <div key={label} style={{ marginBottom: 9 }}>
                  <button onClick={action}
                    style={{ fontSize: 13, color: '#4a6080', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#93c5fd')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4a6080')}
                  >{label}</button>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid #1e2d4a', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 12, color: '#3d5a7a' }}>
              © 2026 ArogyaScribe. Built with ❤️ for Healthcare.
            </p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', animation: 'med-pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 11.5, color: '#3d5a7a' }}>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
