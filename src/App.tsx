import { useTheme } from './hooks/useTheme';
import { DailySudoku } from './components/DailySudoku';

function App() {
  const { theme, toggleTheme } = useTheme();

  return <DailySudoku theme={theme} onToggleTheme={toggleTheme} />;
}

export default App;
