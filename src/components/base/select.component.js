/**
 * Reusable Form Select Component
 */
export class SelectComponent {
  /**
   * @param {Object} props - { id, label, options: [{value, label}], value, onChange }
   */
  constructor(props = {}) {
    this.props = {
      id: `select-${Math.random().toString(36).substr(2, 9)}`,
      label: '',
      options: [],
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

    const select = document.createElement('select');
    select.id = this.props.id;
    select.className = 'select-field';

    this.props.options.forEach((opt) => {
      const optionEl = document.createElement('option');
      optionEl.value = opt.value;
      optionEl.textContent = opt.label;
      if (opt.value === this.props.value) {
        optionEl.selected = true;
      }
      select.appendChild(optionEl);
    });

    if (typeof this.props.onChange === 'function') {
      select.addEventListener('change', (e) => this.props.onChange(e.target.value, e));
    }

    wrapper.appendChild(select);
    return wrapper;
  }
}
