import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-level-up-celebration',
  standalone: true,
  template: `
    <div class="overlay" (click)="dismissed.emit()" role="dialog" aria-label="Level up celebration">
      <div class="celebration-card" (click)="$event.stopPropagation()">
        <div class="glow-ring"></div>
        <div class="level-badge">
          <span class="level-number">{{ level() }}</span>
        </div>
        <h2 class="title">LEVEL UP!</h2>
        <p class="subtitle">You reached level {{ level() }}</p>
        <button type="button" class="dismiss-btn" (click)="dismissed.emit()">Continue</button>
      </div>
    </div>
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        z-index: 200;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        animation: fadeIn 0.3s ease;
      }

      .celebration-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 3rem 2.5rem;
        animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .glow-ring {
        position: absolute;
        width: 180px;
        height: 180px;
        top: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent 70%);
        animation: pulse 2s ease-in-out infinite;
      }

      .level-badge {
        position: relative;
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2));
        border: 3px solid rgba(6, 182, 212, 0.6);
        box-shadow: 0 0 40px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(139, 92, 246, 0.2);
      }

      .level-number {
        font-size: 3rem;
        font-weight: 900;
        font-style: italic;
        background: linear-gradient(135deg, var(--neon-cyan, #00f5ff), rgb(139, 92, 246));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .title {
        font-size: 2rem;
        font-weight: 900;
        font-style: italic;
        letter-spacing: 0.15em;
        color: white;
        text-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
        margin: 0;
      }

      .subtitle {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'JetBrains Mono', monospace;
        margin: 0;
      }

      .dismiss-btn {
        margin-top: 1rem;
        padding: 0.625rem 2rem;
        border-radius: 8px;
        border: 1px solid rgba(6, 182, 212, 0.4);
        background: rgba(6, 182, 212, 0.1);
        color: var(--neon-cyan, #00f5ff);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .dismiss-btn:hover {
        background: rgba(6, 182, 212, 0.2);
        border-color: rgba(6, 182, 212, 0.6);
        box-shadow: 0 0 16px rgba(6, 182, 212, 0.2);
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.5); }
        to { opacity: 1; transform: scale(1); }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.15); opacity: 0.8; }
      }
    `,
  ],
})
export class LevelUpCelebrationComponent {
  level = input.required<number>();
  dismissed = output<void>();
}
