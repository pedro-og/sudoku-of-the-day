import { useState } from 'react';
import { useTheme } from '@features/theme/hooks/useTheme';
import { DailySudoku } from '@features/game/components/DailySudoku';
import { AuthProvider, SideMenu, AccountPage, useRoute } from '@features/auth';

function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { route, navigate } = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);

  if (route === 'account') {
    return (
      <>
        <AccountPage
          onBack={() => navigate('game')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <SideMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigateAccount={() => navigate('account')}
        />
      </>
    );
  }

  return (
    <>
      <DailySudoku
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenMenu={() => setMenuOpen(true)}
      />
      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigateAccount={() => navigate('account')}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
