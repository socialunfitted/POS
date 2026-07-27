/**
 * Reusable Loading Spinner Component
 */
export class LoaderComponent {
  /**
   * @param {Object} props - { text, size }
   */
  constructor(props = {}) {
    this.props = {
      text: 'Loading...',
      size: '24px',
      ...props
    };
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2 justify-center p-4';
    wrapper.innerHTML = `
      <div class="spinner" style="width: ${this.props.size}; height: ${this.props.size};"></div>
      ${this.props.text ? `<span class="text-sm text-secondary">${this.props.text}</span>` : ''}
    `;
    return wrapper;
  }
}
