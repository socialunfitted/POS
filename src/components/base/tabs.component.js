/**
 * Reusable Tabs Navigation Component
 */
export class TabsComponent {
  /**
   * @param {Object} props - { tabs: [{id, label}], activeTab, onTabChange }
   */
  constructor(props = {}) {
    this.props = {
      tabs: [],
      activeTab: '',
      onTabChange: null,
      ...props
    };
  }

  render() {
    const nav = document.createElement('div');
    nav.className = 'flex gap-2 mb-4';
    nav.style.borderBottom = '1px solid var(--color-border)';

    this.props.tabs.forEach((tab) => {
      const btn = document.createElement('button');
      const isActive = tab.id === this.props.activeTab;
      btn.className = `btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`;
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        if (typeof this.props.onTabChange === 'function') {
          this.props.onTabChange(tab.id);
        }
      });
      nav.appendChild(btn);
    });

    return nav;
  }
}
