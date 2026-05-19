import { AuthProvider } from '../features/auth/AuthContext';
import Navbar from '../components/Navbar';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { SocketProvider } from '../features/socket/SocketContext';

const queryClient = new QueryClient();

export default function App({ Component, pageProps, router }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <AuthProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Navbar />
          <AnimatePresence mode="wait">
            <motion.div
              key={router.route}
              initial="pageInitial"
              animate="pageAnimate"
              exit="pageExit"
              variants={{
                pageInitial: { 
                  opacity: 0, 
                  scale: 0.94, 
                  rotateX: 10, 
                  filter: 'blur(5px)',
                  y: 20
                },
                pageAnimate: { 
                  opacity: 1, 
                  scale: 1, 
                  rotateX: 0, 
                  filter: 'blur(0px)',
                  y: 0,
                  transition: { 
                    duration: 0.5, 
                    ease: [0.22, 1, 0.36, 1] 
                  } 
                },
                pageExit: { 
                  opacity: 0, 
                  scale: 1.05, 
                  rotateX: -10, 
                  filter: 'blur(10px)',
                  transition: { duration: 0.3 } 
                },
              }}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>
        </AuthProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
}
