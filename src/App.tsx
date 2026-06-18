import { useState } from 'react';
import { useTheme } from '@features/theme/hooks/useTheme';
import { DailySudoku } from '@features/game/components/DailySudoku';
import { AuthProvider, SideMenu } from '@features/auth';
import { SeoContent } from '@shared/components/SeoContent/SeoContent';

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
      <SeoContent />
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
