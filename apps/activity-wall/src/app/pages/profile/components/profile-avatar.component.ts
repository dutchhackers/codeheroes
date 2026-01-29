import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-profile-avatar',
  standalone: true,
  template: `
    <div class="avatar-container">
      @if (photoUrl()) {
        <div class="avatar-outer">
          <div class="avatar-glow"></div>
          <div class="avatar-border">
            <img
              [src]="photoUrl()"
              [alt]="displayName()"
              class="avatar-img"
              referrerpolicy="no-referrer"
            />
          </div>
        </div>
      } @else {
        <div class="avatar-placeholder">
          {{ initials() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .avatar-container {
      display: flex;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .avatar-outer {
      position: relative;
      width: 96px;
      height: 96px;
    }

    .avatar-border {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      padding: 3px;
      background: linear-gradient(135deg, var(--neon-cyan, #00f5ff), var(--neon-purple, #bf00ff));
      z-index: 1;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }

    .avatar-glow {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--neon-cyan, #00f5ff), var(--neon-purple, #bf00ff));
      opacity: 0.6;
      filter: blur(12px);
      z-index: 0;
      animation: avatarPulse 3s ease-in-out infinite;
    }

    .avatar-placeholder {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;
      color: var(--neon-cyan, #00f5ff);
      border: 3px solid transparent;
      background:
        linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)) padding-box,
        linear-gradient(135deg, var(--neon-cyan, #00f5ff), var(--neon-purple, #bf00ff)) border-box;
      box-shadow:
        0 0 20px rgba(0, 245, 255, 0.4),
        0 0 40px rgba(191, 0, 255, 0.2);
      animation: avatarPulse 3s ease-in-out infinite;
    }

    @keyframes avatarPulse {
      0%, 100% {
        box-shadow:
          0 0 20px rgba(0, 245, 255, 0.4),
          0 0 40px rgba(191, 0, 255, 0.2);
      }
      50% {
        box-shadow:
          0 0 30px rgba(191, 0, 255, 0.5),
          0 0 50px rgba(0, 245, 255, 0.3);
      }
    }

    @media (min-width: 768px) {
      .avatar-outer,
      .avatar-placeholder {
        width: 120px;
        height: 120px;
      }

      .avatar-placeholder {
        font-size: 2.5rem;
      }
    }
  `],
})
export class ProfileAvatarComponent {
  photoUrl = input<string | null>(null);
  displayName = input<string>('');

  initials = computed(() => {
    const name = this.displayName();
    if (!name) return '?';

    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });
}
