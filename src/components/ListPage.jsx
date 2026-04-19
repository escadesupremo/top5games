import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { getList } from '../services/listService';

function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function avatarColor(handle) {
  if (!handle) return 'var(--line-2)';
  return `hsl(${hashStr(handle) % 360} 65% 45%)`;
}

function initials(handle) {
  if (!handle) return '?';
  return handle.replace(/^@/, '').slice(0, 2).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

export default function ListPage({ listId, onCreateNew }) {
  const [list, setList] = useState(null);
  const [status, setStatus] = useState('loading');
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const filmstripRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getList(listId)
      .then((data) => {
        if (!cancelled) {
          setList(data);
          setStatus('ok');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [listId]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const downloadAsImage = async () => {
    const node = filmstripRef.current;
    if (!node || capturing) return;
    setCapturing(true);
    try {
      // Wait for fonts and every <img> inside the filmstrip to finish loading.
      // html-to-image otherwise captures a frame where images are still decoding
      // and the result comes out with blank strips.
      if (document.fonts?.ready) {
        await document.fonts.ready.catch(() => {});
      }
      const imgs = node.querySelectorAll('img');
      await Promise.all(
        Array.from(imgs).map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          });
        })
      );

      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: '#0a0a0c',
      });
      const link = document.createElement('a');
      link.download = `top5-${list?.username || listId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('image capture failed', err);
    } finally {
      setCapturing(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center">
        <div className="font-mono-editor smallcaps text-[var(--fg-dim)]">
          <span className="pulse-dot mr-2" /> loading list #{listId}…
        </div>
      </div>
    );
  }

  if (status === 'error' || !list) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="font-display text-4xl mb-3">404</div>
          <div className="font-mono-editor smallcaps text-[var(--fg-dim)] mb-6">
            / list #{listId} not found
          </div>
          <button onClick={onCreateNew} className="btn-editorial btn-primary">
            ▲ CREATE YOUR OWN
          </button>
        </div>
      </div>
    );
  }

  const games = [1, 2, 3, 4, 5].map((i) => ({
    rank: i,
    name: list[`game_${i}_name`],
    image: list[`game_${i}_image`],
    year: list[`game_${i}_year`],
  }));

  const profileHref = list.is_twitter
    ? `https://x.com/${list.username}`
    : list.is_instagram
    ? `https://instagram.com/${list.username}`
    : null;

  return (
    <div className="list-page">
      <div className="list-actions-bar">
        <button onClick={onCreateNew} className="list-action-btn">
          ← CREATE YOURS
        </button>
        <div className="list-actions-right">
          <button onClick={copyLink} className="list-action-btn">
            {copied ? '✓ COPIED' : 'COPY LINK'}
          </button>
          <button
            onClick={downloadAsImage}
            disabled={capturing}
            className="list-action-btn"
          >
            {capturing ? '▼ RENDERING…' : '▼ DOWNLOAD PNG'}
          </button>
        </div>
      </div>

      <div className="filmstrip" ref={filmstripRef}>
        <div className="film-bar film-bar-top">
          <div className="film-brand">
            <span className="film-tri" />
            <span>
              TOP<span className="film-accent">5</span>.GAMES
            </span>
          </div>
          <div className="film-date">{formatDate(list.created_at)}</div>
        </div>

        {games.map((g, i) => {
          const isHero = i === 0;
          return (
            <div key={i} className={`film-strip${isHero ? ' is-hero' : ''}`}>
              {g.image && (
                <img className="film-strip-bg" src={g.image} alt="" />
              )}
              <div className="film-strip-tint" />

              <div className="film-strip-rank">{String(i + 1).padStart(2, '0')}</div>
              {isHero && <div className="film-strip-badge">★ #1 PICK</div>}

              {!isHero && g.image && (
                <div className="film-strip-chip">
                  <img src={g.image} alt={g.name} />
                </div>
              )}

              {isHero && (
                <div className="film-hero-overlay">
                  <div className="film-kicker">// {list.username ? `@${list.username}'S TOP 5 GAMES` : 'MY TOP 5 GAMES OF ALL TIME'}</div>
                  <div className="film-slogan">THE LIST. NO APOLOGIES.</div>
                  <div className="film-handle">
                    <span
                      className="film-avatar"
                      style={{ background: avatarColor(list.username) }}
                    >
                      {initials(list.username)}
                    </span>
                    {profileHref ? (
                      <a href={profileHref} target="_blank" rel="noopener noreferrer">
                        @{list.username}
                      </a>
                    ) : (
                      <span>@{list.username}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="film-strip-title">
                <h2>{g.name || '— empty slot —'}</h2>
                {g.name && (
                  <div className="film-strip-meta">
                    {g.year || 'CLASSIC'}
                    <span className="film-strip-meta-sep">·</span>
                    RANK {String(i + 1).padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="film-bar film-bar-bot">
          <div className="film-foot-left">
            <div className="film-watermark">VOTE · DEFEND · RANK</div>
            <a href="/" className="film-url">
              top5.games
            </a>
          </div>
          <div className="film-share-pill">LIST #{list.id}</div>
        </div>

        <div className="film-corners">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="list-meta">
        <span className="font-mono-editor smallcaps text-[var(--fg-dimmer)]">
          submitted {formatDate(list.created_at)} · list id #{list.id}
        </span>
      </div>
    </div>
  );
}
