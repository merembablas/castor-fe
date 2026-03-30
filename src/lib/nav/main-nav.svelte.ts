/** Shared open state so the drawer can render outside the header (avoids backdrop-filter clipping `fixed` children). */
class MainNav {
	open = $state(false);

	toggle(): void {
		this.open = !this.open;
	}

	close(): void {
		this.open = false;
	}
}

export const mainNav = new MainNav();

export const MAIN_NAV_MENU_BUTTON_ID = 'main-nav-menu-button';
export const MAIN_NAV_DRAWER_ID = 'main-navigation-drawer';
