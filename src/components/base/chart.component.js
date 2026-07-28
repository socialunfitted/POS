/**
 * Pure Vanilla JS Interactive Chart Component
 * Renders HTML5 Canvas Bar Charts and Category Distribution Progress Bars without external dependencies.
 * Fully responsive, high-DPI (Retina) rendered, non-distorting canvas.
 */
export class ChartComponent {
  /**
   * @param {Object} props - { type: 'bar'|'distribution', data: [], labels: [], datasets: [], title: string }
   */
  constructor(props = {}) {
    this.props = {
      type: 'bar',
      data: [],
      labels: [],
      datasets: [],
      title: 'Sales Chart',
      ...props
    };
  }

  render() {
    if (this.props.type === 'distribution') {
      return this.renderDistributionChart();
    }
    return this.renderBarChart();
  }

  renderBarChart() {
    const card = document.createElement('div');
    card.className = 'card p-4 flex flex-col gap-4 chart-card';

    const header = document.createElement('div');
    header.className = 'flex justify-between items-center';
    header.innerHTML = `
      <h4 class="h4 font-bold text-primary flex items-center gap-2">
        <span>📊</span> ${this.props.title}
      </h4>
      <span class="text-xs text-muted font-medium bg-tertiary px-2 py-1 rounded">Today (8 AM - 6 PM)</span>
    `;
    card.appendChild(header);

    const chartContainer = document.createElement('div');
    chartContainer.className = 'canvas-container w-full relative';
    chartContainer.style.height = '240px';
    chartContainer.style.minHeight = '200px';
    chartContainer.style.width = '100%';

    const canvas = document.createElement('canvas');
    canvas.className = 'chart-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    chartContainer.appendChild(canvas);
    card.appendChild(chartContainer);

    // Parse items from data or labels/datasets
    let items = [];
    if (this.props.data && this.props.data.length > 0) {
      items = this.props.data.map((d) => ({
        label: d.hour || d.label || d.name || '',
        value: Number(d.sales ?? d.value ?? d.amount ?? 0)
      }));
    } else if (this.props.labels && this.props.datasets && this.props.datasets.length > 0) {
      const dataset = this.props.datasets[0];
      items = this.props.labels.map((label, idx) => ({
        label,
        value: Number(dataset.data[idx] || 0)
      }));
    }

    let hoveredIndex = -1;
    let barBoundingBoxes = [];

    const drawChart = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = chartContainer.getBoundingClientRect();
      const cssWidth = rect.width || chartContainer.clientWidth || 400;
      const cssHeight = rect.height || chartContainer.clientHeight || 240;

      const dpr = window.devicePixelRatio || 1;

      // Set actual pixel dimensions to match display size scaled by DPR
      const pixelWidth = Math.floor(cssWidth * dpr);
      const pixelHeight = Math.floor(cssHeight * dpr);

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      if (!items || items.length === 0) {
        ctx.restore();
        return;
      }

      // Padding configuration
      const paddingTop = 30;
      const paddingBottom = 35;
      const paddingLeft = 45;
      const paddingRight = 15;

      const chartWidth = cssWidth - paddingLeft - paddingRight;
      const chartHeight = cssHeight - paddingTop - paddingBottom;

      const maxValRaw = Math.max(...items.map((d) => d.value), 10);
      const maxVal = maxValRaw * 1.18; // Extra head space for top values

      // Draw subtle horizontal grid lines
      const gridCount = 4;
      const computedStyle = getComputedStyle(document.documentElement);
      const gridLineColor = computedStyle.getPropertyValue('--color-border').trim() || 'rgba(255, 255, 255, 0.1)';
      const textColorMuted = computedStyle.getPropertyValue('--color-text-muted').trim() || '#94a3b8';
      const textColorPrimary = computedStyle.getPropertyValue('--color-text-primary').trim() || '#f8fafc';
      const primaryBrandColor = computedStyle.getPropertyValue('--color-primary').trim() || '#6366f1';

      ctx.strokeStyle = gridLineColor;
      ctx.lineWidth = 1;
      ctx.fillStyle = textColorMuted;
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= gridCount; i++) {
        const y = paddingTop + (chartHeight / gridCount) * i;
        const val = maxVal - (maxVal / gridCount) * i;

        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(cssWidth - paddingRight, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillText(`$${Math.round(val)}`, paddingLeft - 8, y);
      }

      // Reset bounding boxes for hover detection
      barBoundingBoxes = [];
      const numBars = items.length;
      const slotWidth = chartWidth / numBars;
      const barWidth = Math.min(Math.max(slotWidth * 0.45, 18), 56);

      items.forEach((item, index) => {
        const xCenter = paddingLeft + index * slotWidth + slotWidth / 2;
        const x = xCenter - barWidth / 2;
        const barHeight = Math.max((item.value / maxVal) * chartHeight, 4);
        const y = paddingTop + chartHeight - barHeight;

        barBoundingBoxes.push({ x, y, width: barWidth, height: barHeight, index, item });

        const isHovered = index === hoveredIndex;

        // Create sleek gradient fill
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isHovered) {
          gradient.addColorStop(0, '#818cf8');
          gradient.addColorStop(1, '#4f46e5');
        } else {
          gradient.addColorStop(0, primaryBrandColor);
          gradient.addColorStop(1, primaryBrandColor + '77');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, barHeight, [6, 6, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();

        if (isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // X-axis label (Hour / Name)
        ctx.fillStyle = isHovered ? primaryBrandColor : textColorMuted;
        ctx.font = isHovered ? 'bold 11px system-ui, -apple-system, sans-serif' : '500 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(item.label, xCenter, paddingTop + chartHeight + 8);

        // Value text above bar
        ctx.fillStyle = isHovered ? '#ffffff' : textColorPrimary;
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`$${item.value}`, xCenter, y - 5);
      });

      ctx.restore();
    };

    // Hover effect handlers
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = -1;
      for (const box of barBoundingBoxes) {
        if (mouseX >= box.x && mouseX <= box.x + box.width && mouseY >= box.y && mouseY <= box.y + box.height) {
          found = box.index;
          break;
        }
      }

      if (hoveredIndex !== found) {
        hoveredIndex = found;
        canvas.style.cursor = found !== -1 ? 'pointer' : 'default';
        drawChart();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      if (hoveredIndex !== -1) {
        hoveredIndex = -1;
        canvas.style.cursor = 'default';
        drawChart();
      }
    });

    // ResizeObserver for responsive auto-redraw
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(drawChart);
    });
    resizeObserver.observe(chartContainer);

    // Initial draw
    setTimeout(drawChart, 20);

    return card;
  }

  renderDistributionChart() {
    const card = document.createElement('div');
    card.className = 'card p-4 flex flex-col gap-4';

    card.innerHTML = `<h4 class="h4 font-bold text-primary flex items-center gap-2"><span>🏷️</span> ${this.props.title}</h4>`;

    const list = document.createElement('div');
    list.className = 'flex flex-col gap-3 mt-1';

    (this.props.data || []).forEach((item) => {
      const row = document.createElement('div');
      row.className = 'flex flex-col gap-1.5';

      row.innerHTML = `
        <div class="flex justify-between text-xs font-semibold">
          <span>${item.category}</span>
          <span class="text-primary font-bold">${item.percent}%</span>
        </div>
        <div class="w-full rounded-full overflow-hidden" style="height: 8px; background: var(--color-bg-tertiary, rgba(255,255,255,0.06));">
          <div style="width: ${item.percent}%; height: 8px; background: ${item.color || 'var(--color-primary)'}; border-radius: 999px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
        </div>
      `;
      list.appendChild(row);
    });

    card.appendChild(list);
    return card;
  }
}

