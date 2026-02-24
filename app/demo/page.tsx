import { Suspense } from 'react';
import DemoContent from './DemoContent';

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-slate-400">Loading...</div></div>}>
      <DemoContent />
    </Suspense>
  );
}
