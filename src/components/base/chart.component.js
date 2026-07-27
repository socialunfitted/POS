/**
 * Pure Vanilla JS Interactive Chart Component
 * Renders HTML5 Canvas Bar Charts and Category Distribution Progress Bars without external dependencies.
 */
export class ChartComponent {
  /**
   * @param {Object} props - { type: 'bar'|'distribution', data: [], title }
   */
  constructor(props = {}) {
    this.props = {
      type: 'bar',
      data: [],
      title: 'Sales Chart',
      ...props
    };
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-wrapper w-full';

    if (this.props.type === 'bar') {
      return this.renderBarChart();
    } else if (this.props.type === 'distribution') {
      return this.renderDistributionChart();
    }

    return wrapper;
  }

  renderBarChart() {
    const card = document.createElement('div');
    card.className = 'card p-4 flex flex-col gap-4';

    const header = document.createElement('div');
    header.className = 'flex justify-between items-center';
    header.innerHTML = `<h4 class="h4 font-bold">${this.props.title}</h4><span class="text-xs text-muted">Today (8 AM - 6 PM)</span>`;
    card.appendChild(header);

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 180;
    canvas.style.width = '100%';
    canvas.style.height = '180px';

    card.appendChild(canvas);

    // Draw Bar Chart on Canvas after DOM mount
    setTimeout(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const data = this.props.data;
      if (!data || data.length === 0) return;

      const maxVal = Math.max(...data.map((d) => d.sales)) || 500;
      const padding = 30;
      const width = canvas.width - padding * 2;
      const height = canvas.height - padding * 2;
      const barWidth = width / data.length - 15;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      data.forEach((item, index) => {
        const x = padding + index * (barWidth + 15);
        const barHeight = (item.sales / maxVal) * height;
        const y = canvas.height - padding - barHeight;

        // Draw Bar
        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        // Label Hour
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.hour, x + barWidth / 2, canvas.height - 8);

        // Value text
        ctx.fillStyle = '#475569';
        ctx.fillText(`$${item.sales}`, x + barWidth / 2, y - 6);
      });
    }, 50);

    return card;
  }

  renderDistributionChart() {
    const card = document.createElement('div');
    card.className = 'card p-4 flex flex-col gap-4';

    card.innerHTML = `<h4 class="h4 font-bold mb-2">${this.props.title}</h4>`;

    const list = document.createElement('div');
    list.className = 'flex flex-col gap-3';

    this.props.data.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'flex flex-col gap-1';

      row.innerHTML = `
        <div class="flex justify-between text-xs font-semibold">
          <span>${item.category}</span>
          <span class="text-primary">${item.percent}%</span>
        </div>
        <div class="w-full bg-muted rounded-full" style="height: 8px; background: var(--color-bg-tertiary);">
          <div style="width: ${item.percent}%; height: 8px; background: ${item.color}; border-radius: 999px; transition: width 0.5s ease;"></div>
        </div>
      `;
      list.appendChild(row);
    });

    card.appendChild(list);
    return card;
  }
}
