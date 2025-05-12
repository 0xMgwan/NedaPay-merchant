import { Toaster } from 'react-hot-toast';

export default function AppToaster() {
  return <Toaster position="top-right" toastOptions={{
    style: { fontSize: 16, borderRadius: 8, padding: '16px 20px' },
    success: { style: { background: '#e6fffa', color: '#065f46' } },
    error: { style: { background: '#fff1f2', color: '#991b1b' } },
  }} />;
}
