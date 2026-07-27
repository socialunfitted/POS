/**
 * Reusable Skeleton Placeholder Loader Component
 */
export class SkeletonComponent {
  /**
   * @param {Object} props - { width, height, radius }
   */
  constructor(props = {}) {
    this.props = {
      width: '100%',
      height: '20px',
      radius: 'var(--radius-sm)',
      ...props
    };
  }

  render() {
    const el = document.createElement('div');
    el.className = 'skeleton';
    el.style.width = this.props.width;
    el.style.height = this.props.height;
    el.style.borderRadius = this.props.radius;
    return el;
  }
}
