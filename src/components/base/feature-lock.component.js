import { featureFlagService } from '../../services/feature-flag.service.js';
import { ButtonComponent } from './button.component.js';

/**
 * Feature Lock UI Component
 * Wraps elements and renders a dynamic glassmorphic overlay if the feature is restricted in the active plan.
 */
export class FeatureLockComponent {
  /**
   * @param {Object} props - { featureKey, featureName, content }
   */
  constructor(props = {}) {
    this.props = {
      featureKey: '',
      featureName: 'Premium Feature',
      content: '',
      ...props
    };
  }

  render() {
    const isUnlocked = featureFlagService.isEnabled(this.props.featureKey);

    const wrapper = document.createElement('div');
    wrapper.className = 'feature-lock-wrapper relative w-full';

    if (isUnlocked) {
      if (typeof this.props.content === 'string') {
        wrapper.innerHTML = this.props.content;
      } else if (this.props.content instanceof HTMLElement) {
        wrapper.appendChild(this.props.content);
      }
      return wrapper;
    }

    // Locked State Overlay Rendering
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';

    // Blurred Preview Content
    const previewContainer = document.createElement('div');
    previewContainer.style.filter = 'blur(4px)';
    previewContainer.style.opacity = '0.5';
    previewContainer.style.pointerEvents = 'none';

    if (typeof this.props.content === 'string') {
      previewContainer.innerHTML = this.props.content;
    } else if (this.props.content instanceof HTMLElement) {
      previewContainer.appendChild(this.props.content);
    }

    // Overlay Lock Card
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 flex flex-col items-center justify-center p-6 text-center';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
    overlay.style.backdropFilter = 'blur(6px)';
    overlay.style.borderRadius = 'var(--radius-lg)';
    overlay.style.zIndex = '10';

    const lockIcon = document.createElement('div');
    lockIcon.className = 'text-4xl mb-2';
    lockIcon.innerHTML = '🔒';

    const title = document.createElement('h4');
    title.className = 'h4 text-white font-bold mb-1';
    title.textContent = `${this.props.featureName} is Locked`;

    const description = document.createElement('p');
    description.className = 'text-xs text-muted mb-4';
    description.textContent = 'This module requires a higher subscription plan tier.';

    const upgradeBtn = new ButtonComponent({
      text: 'Upgrade Plan to Unlock',
      variant: 'primary',
      size: 'sm',
      onClick: () => {
        window.location.hash = '#/subscription';
      }
    }).render();

    overlay.appendChild(lockIcon);
    overlay.appendChild(title);
    overlay.appendChild(description);
    overlay.appendChild(upgradeBtn);

    wrapper.appendChild(previewContainer);
    wrapper.appendChild(overlay);

    return wrapper;
  }
}
