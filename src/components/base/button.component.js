/**
 * Reusable Button Component
 */
export class ButtonComponent {
  /**
   * @param {Object} props - { text, variant, size, icon, disabled, onClick }
   */
  constructor(props = {}) {
    this.props = {
      text: 'Button',
      variant: 'primary', // primary | secondary | danger
      size: 'md',         // sm | md | lg
      icon: '',
      disabled: false,
      onClick: null,
      ...props
    };
    this.element = null;
  }

  render() {
    const btn = document.createElement('button');
    btn.className = `btn btn-${this.props.variant} btn-${this.props.size}`;
    btn.disabled = this.props.disabled;

    let content = '';
    if (this.props.icon) {
      content += `<span class="btn-icon">${this.props.icon}</span>`;
    }
    content += `<span class="btn-text">${this.props.text}</span>`;
    btn.innerHTML = content;

    if (typeof this.props.onClick === 'function') {
      btn.addEventListener('click', this.props.onClick);
    }

    this.element = btn;
    return btn;
  }
}
