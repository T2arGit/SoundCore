import React from 'react'

const WebLanding: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0c',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% -20%, #3b1b6e 0%, transparent 50%)',
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        animation: 'fadeIn 0.7s ease-out',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          marginBottom: '24px',
          borderRadius: '9999px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '14px',
          fontWeight: 500,
          color: '#a78bfa',
        }}>
          Internal Version — Alpha
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          fontWeight: 900,
          marginBottom: '16px',
          letterSpacing: '-0.04em',
          background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.6))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
        }}>
          SOUNDCORE
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '1.2rem',
          color: '#a1a1aa',
          maxWidth: '480px',
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          Ultimate soundboard experience with global hotkeys and zero‑latency audio injection.
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <a
            href="https://github.com/T2arGit/SoundCore/releases"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '16px 32px',
              background: 'white',
              color: 'black',
              fontWeight: 700,
              borderRadius: '16px',
              textDecoration: 'none',
              fontSize: '1rem',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 0 40px rgba(255,255,255,0.15)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            ⬇ Download for Windows
          </a>

          <a
            href="https://github.com/T2arGit/SoundCore"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '16px 32px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              fontWeight: 700,
              color: 'white',
              textDecoration: 'none',
              fontSize: '1rem',
              transition: 'background 0.15s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          >
            GitHub
          </a>
        </div>

        {/* Tech stack */}
        <div style={{
          marginTop: '80px',
          paddingTop: '40px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          gap: '48px',
          justifyContent: 'center',
          opacity: 0.25,
        }}>
          {['ELECTRON', 'REACT', 'VITE'].map(tech => (
            <span key={tech} style={{
              fontWeight: 700,
              fontSize: '1.4rem',
              fontStyle: 'italic',
              letterSpacing: '0.15em',
              color: 'white',
            }}>{tech}</span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '40px',
        color: '#52525b',
        fontSize: '14px',
        fontWeight: 500,
      }}>
        © 2026 Soundcore. All rights reserved.
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default WebLanding
