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
        <div class="avatar-placeholder" role="img" [attr.aria-label]="displayName() + ' avatar'">
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
      background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
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
      background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
      opacity: 0.6;
      filter: blur(12px);
      z-index: 0;
      animation: avatarPulse 2.5s ease-in-out infinite;
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
      color: var(--neon-cyan);
      border: 3px solid transparent;
      background:
        linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)) padding-box,
        linear-gradient(135deg, var(--neon-cyan), var(--neon-purple)) border-box;
      box-shadow:
        0 0 20px color-mix(in srgb, var(--neon-cyan) 40%, transparent),
        0 0 40px color-mix(in srgb, var(--neon-purple) 20%, transparent);
      animation: avatarPulse 2.5s ease-in-out infinite;
    }

    @keyframes avatarPulse {
      0%, 100% {
        box-shadow:
          0 0 20px color-mix(in srgb, var(--neon-cyan) 40%, transparent),
          0 0 40px color-mix(in srgb, var(--neon-purple) 20%, transparent);
      }
      50% {
        box-shadow:
          0 0 30px color-mix(in srgb, var(--neon-purple) 50%, transparent),
          0 0 50px color-mix(in srgb, var(--neon-cyan) 30%, transparent);
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
