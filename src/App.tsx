import { useState } from 'react';
import { useTheme } from '@features/theme/hooks/useTheme';
import { DailySudoku } from '@features/game/components/DailySudoku';
import { AuthProvider, SideMenu } from '@features/auth';

function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

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
        theme={theme}
        onToggleTheme={toggleTheme}
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
