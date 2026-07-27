/**
 * Reusable Form Input Component
 */
export class InputComponent {
  /**
   * @param {Object} props - { id, label, type, placeholder, value, onChange }
   */
  constructor(props = {}) {
    this.props = {
      id: `input-${Math.random().toString(36).substr(2, 9)}`,
      label: '',
      type: 'text',
      placeholder: '',
      value: '',
      onChange: null,
      ...props
    };
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group';

    if (this.props.label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'input-label';
      labelEl.setAttribute('for', this.props.id);
      labelEl.textContent = this.props.label;
      wrapper.appendChild(labelEl);
    }

    const input = document.createElement('input');
    input.id = this.props.id;
    input.type = this.props.type;
    input.className = 'input-field';
    input.placeholder = this.props.placeholder;
    input.value = this.props.value;

    if (typeof this.props.onChange === 'function') {
      input.addEventListener('input', (e) => this.props.onChange(e.target.value, e));
    }

    wrapper.appendChild(input);
    return wrapper;
  }
}
