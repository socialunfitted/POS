/**
 * Reusable Card Container Component
 */
export class CardComponent {
  /**
   * @param {Object} props - { title, subtitle, content, footer }
   */
  constructor(props = {}) {
    this.props = {
      title: '',
      subtitle: '',
      content: '',
      footer: '',
      ...props
    };
  }

  render() {
    const card = document.createElement('div');
    card.className = 'card';

    let html = '';
    if (this.props.title) {
      html += `<div class="card-header mb-4">
        <h3 class="h4">${this.props.title}</h3>
        ${this.props.subtitle ? `<p class="text-sm text-secondary">${this.props.subtitle}</p>` : ''}
      </div>`;
    }

    html += `<div class="card-body">${this.props.content}</div>`;

    if (this.props.footer) {
      html += `<div class="card-footer mt-4 pt-4" style="border-top: 1px solid var(--color-border);">${this.props.footer}</div>`;
    }

    card.innerHTML = html;
    return card;
  }
}
