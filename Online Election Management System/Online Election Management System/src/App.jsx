import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute'

// Layouts
import DashboardLayout from './components/layout/DashboardLayout'

// Public Pages
import LandingPage from './pages/public/LandingPage'
import ElectionsList from './pages/public/ElectionsList'
import ElectionDetails from './pages/public/ElectionDetails'
import ResultsPage from './pages/public/ResultsPage'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Shared Pages
import ProfilePage from './pages/ProfilePage'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminApprovals from './pages/admin/AdminApprovals'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminElections from './pages/admin/AdminElections'

// Creator Pages
import CreatorDashboard from './pages/creator/CreatorDashboard'
import CreateElectionPage from './pages/creator/CreateElectionPage'
import ManageCandidates from './pages/creator/ManageCandidates'
import CreatorElections from './pages/creator/CreatorElections'
import CreatorResults from './pages/creator/CreatorResults'
import CreatorVoters from './pages/creator/CreatorVoters'

// Voter Pages
import VoterDashboard from './pages/voter/VoterDashboard'
import VotingPage from './pages/voter/VotingPage'
import VoterNotifications from './pages/voter/VoterNotifications'
import VoterMyVotes from './pages/voter/VoterMyVotes'
import VoterResults from './pages/voter/VoterResults'
import VoterElections from './pages/voter/VoterElections'

const router = createBrowserRouter([
  // Public Routes
  { path: '/', element: <LandingPage /> },
  { path: '/elections', element: <ElectionsList /> },
  { path: '/elections/:id', element: <ElectionDetails /> },
  { path: '/elections/:id/results', element: <ResultsPage /> },

  // Auth Routes (redirect if already logged in)
  {
    element: <PublicRoute><Outlet /></PublicRoute>,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ]
  },

  // Admin Routes
  {
    element: <ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: '/admin', element: <AdminDashboard /> },
      { path: '/admin/approvals', element: <AdminApprovals /> },
      { path: '/admin/elections', element: <AdminElections /> },
      { path: '/admin/elections/new', element: <CreateElectionPage /> },
      { path: '/admin/elections/:id/candidates', element: <ManageCandidates /> },
      { path: '/admin/users', element: <AdminUsers /> },
      { path: '/admin/audit', element: <AdminAuditLogs /> },
      { path: '/admin/notifications', element: <AdminNotifications /> },
      { path: '/admin/profile', element: <ProfilePage /> },
    ]
  },

  // Creator Routes
  {
    element: <ProtectedRoute roles={['election_creator', 'admin']}><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: '/creator', element: <CreatorDashboard /> },
      { path: '/creator/elections', element: <CreatorElections /> },
      { path: '/creator/elections/new', element: <CreateElectionPage /> },
      { path: '/creator/elections/:id/candidates', element: <ManageCandidates /> },
      { path: '/creator/candidates', element: <Navigate to="/creator/elections" replace /> },
      { path: '/creator/voters', element: <CreatorVoters /> },
      { path: '/creator/notifications', element: <VoterNotifications /> },
      { path: '/creator/results', element: <CreatorResults /> },
      { path: '/creator/profile', element: <ProfilePage /> },
    ]
  },

  // Voter Routes (only for voters)
  {
    element: <ProtectedRoute roles={['voter']}><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: '/voter', element: <VoterDashboard /> },
      { path: '/voter/elections', element: <VoterElections /> },
      { path: '/voter/votes', element: <VoterMyVotes /> },
      { path: '/voter/results', element: <VoterResults /> },
      { path: '/voter/notifications', element: <VoterNotifications /> },
      { path: '/voter/profile', element: <ProfilePage /> },
    ]
  },

  // Profile route — redirect to role-specific profile
  {
    path: '/profile',
    element: <ProtectedRoute roles={['admin', 'election_creator', 'voter']}><ProfileRedirect /></ProtectedRoute>
  },

  // Voting Interface (only for voters)
  {
    element: <ProtectedRoute roles={['voter']}><Outlet /></ProtectedRoute>,
    children: [
      { path: '/vote/:id', element: <VotingPage /> },
    ]
  },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> }
])

import { Toaster } from 'react-hot-toast'
import { useAuth } from './contexts/AuthContext'
import LoadingScreen from './components/ui/LoadingScreen'

function ProfileRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  const redirectMap = {
    admin: '/admin/profile',
    election_creator: '/creator/profile',
    voter: '/voter/profile',
  }
  return <Navigate to={redirectMap[profile?.role] || '/voter/profile'} replace />
}

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
          }
        }}
      />
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
