import { useTheme } from '@features/theme/hooks/useTheme';
import { DailySudoku } from '@features/game/components/DailySudoku';

function App() {
  const { theme, toggleTheme } = useTheme();

  return <DailySudoku theme={theme} onToggleTheme={toggleTheme} />;
}

export default App;
