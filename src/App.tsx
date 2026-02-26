import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RoomsPage from './pages/RoomsPage';
import RoomMembersPage from './pages/RoomMembersPage';
import ProfilePage from './pages/ProfilePage';
import CommunityPage from './pages/CommunityPage';
import SettingsPage from './pages/SettingsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import RoomLayout from './components/RoomLayout';
import RoomArticlesPage from './pages/RoomArticlesPage';
import RoomWikiPage from './pages/RoomWikiPage';
import SavedArticlesPage from './pages/SavedArticlesPage';
import AchievementsPage from './pages/AchievementsPage';
import WikiPage from './pages/WikiPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Replace with proper Loader component later
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const Home = () => {
  const { user } = useAuth();
  if (user?.selectedDirectionId) {
    return <Navigate to={`/${user.selectedDirectionId}/rooms`} replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />


          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Home />} />
            <Route path="/:directionId/rooms" element={<RoomsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/saved" element={<SavedArticlesPage />} />
            <Route path="/wiki" element={<WikiPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
          </Route>

          <Route path="/rooms/:roomId" element={
            <PrivateRoute>
              <RoomLayout />
            </PrivateRoute>
          }>
            <Route index element={<RoomDetailPage />} />
            <Route path="articles" element={<RoomArticlesPage />} />
            <Route path="wiki" element={<RoomWikiPage />} />
            <Route path="members" element={<RoomMembersPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
