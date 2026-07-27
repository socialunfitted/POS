/**
 * Reusable Badge Indicator Component
 */
export class BadgeComponent {
  /**
   * @param {Object} props - { text, variant }
   */
  constructor(props = {}) {
    this.props = {
      text: 'Badge',
      variant: 'primary', // primary | success | warning | danger
      ...props
    };
  }

  render() {
    const span = document.createElement('span');
    span.className = `badge badge-${this.props.variant}`;
    span.textContent = this.props.text;
    return span;
  }
}
