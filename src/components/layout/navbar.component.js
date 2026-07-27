export class NavbarComponent {
  render() {
    const nav = document.createElement('nav');
    nav.className = 'navbar flex items-center justify-between p-4 bg-secondary border-b';
    nav.innerHTML = `
      <div class="font-bold text-primary">OmniPOS Platform</div>
      <div class="flex items-center gap-2">
        <a href="#/login" class="btn btn-primary btn-sm">Login</a>
      </div>
    `;
    return nav;
  }
}
