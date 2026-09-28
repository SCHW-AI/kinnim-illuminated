import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { HomePage } from './ui/HomePage';
import { MishnahRoute } from './ui/MishnahPage';
import { NotFound } from './ui/NotFound';
import { Shell } from './ui/Shell';

// Dev-only playground; the DEV guard lets production builds drop the chunk entirely.
const StagePlayground = import.meta.env.DEV ? lazy(() => import('./dev/StagePlayground')) : null;

export default function App() {
  return (
    <Routes>
      {/* dev routes (Phase 3) */}
      {StagePlayground && (
        <Route
          path="/dev/stage"
          element={
            <main className="mx-auto max-w-3xl p-4">
              <Suspense fallback={null}>
                <StagePlayground />
              </Suspense>
            </main>
          }
        />
      )}
      <Route
        path="/"
        element={
          <Shell>
            <HomePage />
          </Shell>
        }
      />
      <Route
        path="/mishnah/:id"
        element={
          <Shell>
            <MishnahRoute />
          </Shell>
        }
      />
      <Route
        path="/mishnah/:id/:caseId"
        element={
          <Shell>
            <MishnahRoute />
          </Shell>
        }
      />
      <Route
        path="*"
        element={
          <Shell>
            <NotFound />
          </Shell>
        }
      />
    </Routes>
  );
}
