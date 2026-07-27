/**
 * Reusable Toggle Switch Component
 */
export class SwitchComponent {
  /**
   * @param {Object} props - { id, label, checked, onChange }
   */
  constructor(props = {}) {
    this.props = {
      id: `switch-${Math.random().toString(36).substr(2, 9)}`,
      label: '',
      checked: false,
      onChange: null,
      ...props
    };
  }

  render() {
    const wrapper = document.createElement('label');
    wrapper.className = 'flex items-center gap-2 cursor-pointer';
    wrapper.setAttribute('for', this.props.id);

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = this.props.id;
    input.checked = this.props.checked;

    if (typeof this.props.onChange === 'function') {
      input.addEventListener('change', (e) => this.props.onChange(e.target.checked));
    }

    wrapper.appendChild(input);
    if (this.props.label) {
      const span = document.createElement('span');
      span.className = 'text-sm font-medium text-primary';
      span.textContent = this.props.label;
      wrapper.appendChild(span);
    }

    return wrapper;
  }
}
