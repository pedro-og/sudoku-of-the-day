# Design Patterns & Code Examples

**Last Updated:** 2026-03-15
**Audience:** Developers writing new code
**Purpose:** Concrete, copy-paste-ready examples of how to implement common patterns

---

## 📋 Table of Contents

1. [Creating a New Feature](#creating-a-new-feature)
2. [Creating a New Component](#creating-a-new-component)
3. [Creating a Custom Hook](#creating-a-custom-hook)
4. [Creating Pure Functions](#creating-pure-functions)
5. [Writing Tests](#writing-tests)
6. [Using Shared Primitives](#using-shared-primitives)
7. [CSS Modules Pattern](#css-modules-pattern)
8. [Type Safety](#type-safety)
9. [Error Handling](#error-handling)

---

## Creating a New Feature

### Step 1: Create Folder Structure

```bash
mkdir -p src/features/myfeature/{components,hooks,lib,__tests__}
```

### Step 2: Create index.ts Barrel Export

```typescript
// src/features/myfeature/index.ts

// Components
export { MyComponent } from './components/MyComponent';

// Hooks
export { useMyHook } from './hooks/useMyHook';

// Lib
export { myFunction } from './lib/myFunction';
export type { MyType } from './lib/myFunction';
```

### Step 3: Add to App.tsx or Parent Component

```typescript
// src/App.tsx
import { MyFeature } from '@features/myfeature';

export function App() {
  return (
    <div>
      <MyFeature />
    </div>
  );
}
```

---

## Creating a New Component

### Simple Presentational Component

```typescript
// src/features/myfeature/components/MyCard.tsx
import css from './MyCard.module.css';
import { Button } from '@shared';

interface MyCardProps {
  title: string;
  description: string;
  onAction: () => void;
  disabled?: boolean;
}

export function MyCard({
  title,
  description,
  onAction,
  disabled = false,
}: MyCardProps) {
  return (
    <div className={css.card} data-disabled={disabled}>
      <h2 className={css.title}>{title}</h2>
      <p className={css.description}>{description}</p>
      <Button
        onClick={onAction}
        disabled={disabled}
        variant="primary"
      >
        Click Me
      </Button>
    </div>
  );
}
```

```css
/* src/features/myfeature/components/MyCard.module.css */
.card {
  padding: 16px;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card[data-disabled] {
  opacity: 0.5;
  pointer-events: none;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 16px 0;
}
```

### Component with State

```typescript
// src/features/myfeature/components/Counter.tsx
import { useState } from 'react';
import css from './Counter.module.css';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className={css.container}>
      <div className={css.display}>{count}</div>
      <button
        className={css.button}
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
      <button
        className={css.button}
        onClick={() => setCount(0)}
      >
        Reset
      </button>
    </div>
  );
}
```

### Component Using Custom Hook

```typescript
// src/features/myfeature/components/MyFeatureView.tsx
import { useMyData } from '../hooks/useMyData';
import css from './MyFeatureView.module.css';

export function MyFeatureView() {
  const { data, loading, error } = useMyData();

  if (loading) return <div className={css.loader}>Loading...</div>;
  if (error) return <div className={css.error}>Error: {error.message}</div>;

  return (
    <div className={css.container}>
      {data?.map((item) => (
        <div key={item.id} className={css.item}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

---

## Creating a Custom Hook

### Simple State Hook

```typescript
// src/features/myfeature/hooks/useToggle.ts
import { useState } from 'react';

export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = () => setValue((prev) => !prev);
  const on = () => setValue(true);
  const off = () => setValue(false);

  return { value, toggle, on, off };
}

// Usage
const { value: isOpen, toggle } = useToggle(false);
```

### Hook with Side Effects

```typescript
// src/features/myfeature/hooks/useTimeout.ts
import { useEffect, useRef } from 'react';

export function useTimeout(callback: () => void, delayMs: number) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!delayMs) return;

    const timeoutId = setTimeout(() => {
      callbackRef.current();
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [delayMs]);
}

// Usage
useTimeout(() => {
  console.log('Delayed action');
}, 3000);
```

### Hook with Cleanup

```typescript
// src/features/myfeature/hooks/useEventListener.ts
import { useEffect, useRef } from 'react';

export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element: EventTarget = window
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const listener = (event: Event) => handlerRef.current(event);

    element.addEventListener(eventName, listener);

    return () => {
      element.removeEventListener(eventName, listener);
    };
  }, [eventName, element]);
}

// Usage
useEventListener('keydown', (e) => {
  console.log(`Key pressed: ${e.key}`);
});
```

### Hook Combining Multiple Concerns

```typescript
// src/features/myfeature/hooks/usePaginatedData.ts
import { useState, useEffect } from 'react';

interface UsePaginatedDataOptions {
  pageSize: number;
  onPageChange?: (page: number) => void;
}

export function usePaginatedData<T>(
  data: T[],
  options: UsePaginatedDataOptions
) {
  const { pageSize, onPageChange } = options;
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIdx = currentPage * pageSize;
  const endIdx = startIdx + pageSize;
  const pageData = data.slice(startIdx, endIdx);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  return {
    data: pageData,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
  };
}
```

---

## Creating Pure Functions

### Simple Validation Function

```typescript
// src/features/myfeature/lib/validators.ts

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Usage
const result = isValidPassword('weak');
if (!result.valid) {
  console.error(result.errors);
}
```

### Calculation Function

```typescript
// src/features/myfeature/lib/calculations.ts

export function calculateDiscount(
  originalPrice: number,
  discountPercent: number
): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount must be between 0 and 100');
  }
  return originalPrice * (1 - discountPercent / 100);
}

export function calculateTax(
  amount: number,
  taxRate: number
): number {
  return amount * (1 + taxRate / 100);
}

// Usage
const final = calculateTax(calculateDiscount(100, 10), 7);
```

### Transformation Function

```typescript
// src/features/myfeature/lib/transformers.ts

export interface RawItem {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormattedItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export function formatItem(raw: RawItem): FormattedItem {
  return {
    id: raw.id,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

// Usage
const items: RawItem[] = fetchItems();
const formatted = items.map(formatItem);
```

---

## Writing Tests

### Component Test

```typescript
// src/features/myfeature/components/__tests__/MyCard.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyCard } from '../MyCard';

describe('MyCard', () => {
  it('renders title and description', () => {
    render(
      <MyCard
        title="Test Title"
        description="Test Description"
        onAction={() => {}}
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <MyCard
        title="Test"
        description="Test"
        onAction={onAction}
      />
    );

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(onAction).toHaveBeenCalledOnce();
  });

  it('disables button when disabled prop is true', () => {
    render(
      <MyCard
        title="Test"
        description="Test"
        onAction={() => {}}
        disabled
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
```

### Hook Test

```typescript
// src/features/myfeature/hooks/__tests__/useToggle.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToggle } from '../useToggle';

describe('useToggle', () => {
  it('initializes with provided value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current.value).toBe(true);
  });

  it('toggles value when toggle is called', () => {
    const { result } = renderHook(() => useToggle(false));

    expect(result.current.value).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(true);
  });

  it('sets value to true when on is called', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current.on();
    });

    expect(result.current.value).toBe(true);
  });

  it('sets value to false when off is called', () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => {
      result.current.off();
    });

    expect(result.current.value).toBe(false);
  });
});
```

### Pure Function Test

```typescript
// src/features/myfeature/lib/__tests__/validators.test.ts
import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword } from '../validators';

describe('validators', () => {
  describe('isValidEmail', () => {
    it('returns true for valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
    });

    it('returns false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('returns valid: true for strong passwords', () => {
      const result = isValidPassword('StrongPass123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns errors for weak passwords', () => {
      const result = isValidPassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
```

---

## Using Shared Primitives

### Modal Dialog

```typescript
// src/features/myfeature/components/MyModal.tsx
import { useState } from 'react';
import { Modal, Button } from '@shared';

export function MyModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Dialog
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        ariaLabel="My Dialog"
      >
        <h2>Dialog Title</h2>
        <p>Dialog content goes here</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="primary"
            onClick={() => setIsOpen(false)}
          >
            Confirm
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
```

### StatCard Display

```typescript
// src/features/myfeature/components/StatsDisplay.tsx
import { StatCard } from '@shared';

export function StatsDisplay() {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <StatCard
        value="1,234"
        label="Total Players"
      />
      <StatCard
        value="89%"
        label="Completion Rate"
      />
      <StatCard
        value="3:45"
        label="Avg. Time"
      />
    </div>
  );
}
```

### Icon Button

```typescript
// src/features/myfeature/components/Toolbar.tsx
import { IconButton } from '@shared';
import { UndoIcon, EraseIcon } from '@shared';

export function Toolbar() {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <IconButton
        icon={<UndoIcon size={20} />}
        label="Undo"
        onClick={() => {}}
        active={false}
      />
      <IconButton
        icon={<EraseIcon size={20} />}
        label="Erase"
        onClick={() => {}}
        active={false}
      />
    </div>
  );
}
```

---

## CSS Modules Pattern

### Component with Dynamic Styling

```typescript
// src/features/myfeature/components/StatusBadge.tsx
import css from './StatusBadge.module.css';

type Status = 'success' | 'warning' | 'error' | 'pending';

interface StatusBadgeProps {
  status: Status;
  children: string;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return (
    <span className={css.badge} data-status={status}>
      {children}
    </span>
  );
}
```

```css
/* src/features/myfeature/components/StatusBadge.module.css */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: background-color 0.2s, color 0.2s;
}

.badge[data-status="success"] {
  background-color: var(--color-success);
  color: var(--text-on-success);
}

.badge[data-status="warning"] {
  background-color: var(--color-warning);
  color: var(--text-on-warning);
}

.badge[data-status="error"] {
  background-color: var(--color-error);
  color: var(--text-on-error);
}

.badge[data-status="pending"] {
  background-color: var(--color-pending);
  color: var(--text-on-pending);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
```

### Responsive Design with CSS Modules

```typescript
// src/features/myfeature/components/ResponsiveGrid.tsx
import css from './ResponsiveGrid.module.css';

export function ResponsiveGrid({ items }: { items: string[] }) {
  return (
    <div className={css.grid}>
      {items.map((item) => (
        <div key={item} className={css.item}>
          {item}
        </div>
      ))}
    </div>
  );
}
```

```css
/* src/features/myfeature/components/ResponsiveGrid.module.css */
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}

.item {
  padding: 12px;
  background: var(--bg-card);
  border-radius: 8px;
  text-align: center;
}
```

---

## Type Safety

### Interface Definition

```typescript
// src/features/myfeature/lib/types.ts

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  role: 'admin' | 'user' | 'guest';
}

export interface CreateUserInput {
  name: string;
  email: string;
  role?: User['role'];
}

export interface UserStats {
  totalUsers: number;
  activeToday: number;
  conversionRate: number;
}
```

### Generic Types

```typescript
// src/features/myfeature/lib/api.ts

export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// Usage
const response: ApiResponse<User> = await fetchUser(id);
const paginated: PaginatedResponse<User> = await fetchUsers(page);
```

### Discriminated Unions

```typescript
// src/features/myfeature/lib/actions.ts

export type GameAction =
  | { type: 'START'; payload: { difficulty: 'easy' | 'medium' | 'hard' } }
  | { type: 'MOVE'; payload: { row: number; col: number; value: number } }
  | { type: 'UNDO' }
  | { type: 'RESET' };

// Type-safe dispatch
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      // action.payload.difficulty is available and typed
      return { ...state, difficulty: action.payload.difficulty };
    case 'MOVE':
      return { ...state, board: updateBoard(state.board, action.payload) };
    case 'UNDO':
      return undoMove(state);
    case 'RESET':
      return getInitialState();
  }
}
```

---

## Error Handling

### Try-Catch Pattern

```typescript
// src/features/myfeature/hooks/useAsync.ts
import { useState, useEffect } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setState({ data: null, loading: true, error: null });
        const data = await asyncFn();
        if (mounted) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (mounted) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, deps);

  return state;
}
```

### Custom Error Class

```typescript
// src/features/myfeature/lib/errors.ts

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Usage
try {
  validateEmail(email);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Invalid ${error.field}: ${error.message}`);
  }
}
```

### Error Boundary Component

```typescript
// src/shared/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback?.(this.state.error) ?? (
        <div style={{ padding: '16px', color: 'red' }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Summary

**Key Principles:**
1. ✅ Small, focused components (one responsibility)
2. ✅ Pure functions in lib/ (no side effects)
3. ✅ Custom hooks for state logic
4. ✅ CSS Modules for scoped styling
5. ✅ TypeScript for type safety
6. ✅ Tests for business logic
7. ✅ Barrel exports for clean imports

**Next Steps:**
- Copy patterns into your code
- Adjust types/names for your domain
- Write tests before implementation
- Reference REACT_BEST_PRACTICES.md for deeper insights

