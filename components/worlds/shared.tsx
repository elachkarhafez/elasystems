'use client';
import type { ReactNode } from 'react';
import type { WorldId } from '@/lib/content';

export type WorldProps = { onBack: () => void; onNext: () => void; next: WorldId };

const NAMES: Record<WorldId, string> = { websites: 'Websites', apps: 'Apps', systems: 'Systems', contact: 'Start a project' };

// a world's opening: kicker, a title set line by line, a lede
export function WorldIntro({ kicker, title, lede, note, aside }: { kicker: string; title: string; lede: string; note?: string; aside?: ReactNode }) {
  const lines = title.split(/(?<=\.)\s+/);
  return (
    <header className={`w-intro ${aside ? 'has-aside' : ''}`}>
      <p className="label w-kicker" data-arrive>{kicker}</p>
      <h1 className="w-title">{lines.map((l) => (<span className="w-line" key={l}><span data-arrive-line>{l}</span></span>))}</h1>
      <p className="w-lede" data-arrive>{lede}</p>
      {note ? <p className="w-note label" data-arrive>{note}</p> : null}
      <span className="w-scroll label" data-arrive aria-hidden="true"><i />Scroll</span>
      {aside ? <div className="w-aside" data-arrive aria-hidden="true">{aside}</div> : null}
    </header>
  );
}

// every world ends the same way: onward to the next world, or back out to the hub
export function WorldEnd({ onBack, onNext, next, line }: WorldProps & { line: string }) {
  return (
    <footer className="w-end">
      <p className="w-end-line">{line}</p>
      <div className="w-end-actions">
        <button className="w-next" onClick={onNext}>
          <span className="label">Next</span>
          <b>{NAMES[next]}</b>
          <i aria-hidden="true" />
        </button>
        <button className="w-back" onClick={onBack}><span aria-hidden="true">←</span> Back to the hub</button>
      </div>
    </footer>
  );
}
