import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import { trackSession } from "./lib/analytics";

import SplashScreen from "./screens/SplashScreen";
import Onboarding from "./screens/Onboarding";
import SignIn from "./screens/SignIn";
import SignUp from "./screens/SignUp";
import AuthCallback from "./screens/AuthCallback";
import Home from "./screens/Home";
import CreateHub from "./screens/CreateHub";
import ScriptInput from "./screens/ScriptInput";
import ImageGeneration from "./screens/ImageGeneration";
import VoiceSelection from "./screens/VoiceSelection";
import VoiceProgress from "./screens/VoiceProgress";
import AnimationSettings from "./screens/AnimationSettings";
import VideoProgress from "./screens/VideoProgress";
import MyProjects from "./screens/MyProjects";
import VideoPreview from "./screens/VideoPreview";
import ExportDownload from "./screens/ExportDownload";
import SubscriptionPlans from "./screens/SubscriptionPlans";
import Payment from "./screens/Payment";
import PaymentCallback from "./screens/PaymentCallback";
import PaymentSuccess from "./screens/PaymentSuccess";
import Profile from "./screens/Profile";
import Settings from "./screens/Settings";
import Notifications from "./screens/Notifications";
import HelpSupport from "./screens/HelpSupport";
import Templates from "./screens/Templates";

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return children;
}

export default function App() {
  useEffect(() => {
    trackSession();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout><SplashScreen /></Layout>} />
      <Route path="/onboarding/:step" element={<Layout><Onboarding /></Layout>} />
      <Route path="/signin" element={<Layout><SignIn /></Layout>} />
      <Route path="/signup" element={<Layout><SignUp /></Layout>} />
      <Route path="/auth/callback" element={<Layout><AuthCallback /></Layout>} />

      <Route path="/home" element={<Layout><Protected><Home /></Protected></Layout>} />
      <Route path="/templates" element={<Layout><Protected><Templates /></Protected></Layout>} />
      <Route path="/create" element={<Layout><Protected><CreateHub /></Protected></Layout>} />
      <Route path="/create/script" element={<Layout><Protected><ScriptInput /></Protected></Layout>} />
      <Route path="/create/style" element={<Layout><Protected><ImageGeneration /></Protected></Layout>} />
      <Route path="/create/voice" element={<Layout><Protected><VoiceSelection /></Protected></Layout>} />
      <Route path="/create/voice-progress" element={<Layout><Protected><VoiceProgress /></Protected></Layout>} />
      <Route path="/create/settings" element={<Layout><Protected><AnimationSettings /></Protected></Layout>} />
      <Route path="/create/video-progress" element={<Layout><Protected><VideoProgress /></Protected></Layout>} />

      <Route path="/projects" element={<Layout><Protected><MyProjects /></Protected></Layout>} />
      <Route path="/projects/:id" element={<Layout><Protected><VideoPreview /></Protected></Layout>} />
      <Route path="/projects/:id/export" element={<Layout><Protected><ExportDownload /></Protected></Layout>} />

      <Route path="/subscription" element={<Layout><Protected><SubscriptionPlans /></Protected></Layout>} />
      <Route path="/payment" element={<Layout><Protected><Payment /></Protected></Layout>} />
      <Route path="/payment/callback" element={<Layout><Protected><PaymentCallback /></Protected></Layout>} />
      <Route path="/payment/success" element={<Layout><Protected><PaymentSuccess /></Protected></Layout>} />

      <Route path="/profile" element={<Layout><Protected><Profile /></Protected></Layout>} />
      <Route path="/settings" element={<Layout><Protected><Settings /></Protected></Layout>} />
      <Route path="/notifications" element={<Layout><Protected><Notifications /></Protected></Layout>} />
      <Route path="/help" element={<Layout><Protected><HelpSupport /></Protected></Layout>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
