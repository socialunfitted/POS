/**
 * Reusable Modal Dialog Component
 */
export class ModalComponent {
  /**
   * @param {Object} props - { title, content, onClose }
   */
  constructor(props = {}) {
    this.props = {
      title: 'Modal Title',
      content: '',
      onClose: null,
      ...props
    };
    this.overlay = null;
  }

  render() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const card = document.createElement('div');
    card.className = 'modal-card p-6';

    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-4';
    header.innerHTML = `<h3 class="h4">${this.props.title}</h3>`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-secondary btn-sm';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof this.props.content === 'string') {
      body.innerHTML = this.props.content;
    } else if (this.props.content instanceof HTMLElement) {
      body.appendChild(this.props.content);
    }

    card.appendChild(header);
    card.appendChild(body);
    overlay.appendChild(card);

    this.overlay = overlay;
    return overlay;
  }

  open() {
    if (!this.overlay) this.render();
    document.body.appendChild(this.overlay);
    setTimeout(() => this.overlay.classList.add('active'), 10);
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      setTimeout(() => {
        if (this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        if (typeof this.props.onClose === 'function') {
          this.props.onClose();
        }
      }, 300);
    }
  }
}
