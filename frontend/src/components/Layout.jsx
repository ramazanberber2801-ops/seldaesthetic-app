import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import { useCallback, useState } from "react";
import BurgerMenu from "./BurgerMenu";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="min-h-screen bg-paper flex flex-col" data-testid="app-shell">
      <BurgerMenu
        open={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={closeMenu}
      />
      <main className="flex-1 pb-28 max-w-screen-md mx-auto w-full">
        <Outlet />
        <Footer />
      </main>
      <BottomNav />
    </div>
  );
}
