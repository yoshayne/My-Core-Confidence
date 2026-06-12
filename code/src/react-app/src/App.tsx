import { Routes, Route } from "react-router-dom";
import { ClerkLoading, ClerkLoaded, SignedIn, SignedOut } from "@clerk/clerk-react";
import Landing from "./pages/Landing";
import SsoCallback from "./pages/SsoCallback";
import Library from "./pages/Library";
import Workouts from "./pages/Workouts";
import Player from "./pages/Player";
import Progress from "./pages/Progress";
import Favorites from "./pages/Favorites";
import Subscribe from "./pages/Subscribe";
import SubscribeSuccess from "./pages/SubscribeSuccess";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <>
      <ClerkLoading>
        <div className="min-h-screen bg-bg" />
      </ClerkLoading>
      <ClerkLoaded>
        <Routes>
          <Route path="/sso-callback" element={<SsoCallback />} />
          <Route
            path="/"
            element={
              <>
                <SignedOut>
                  <Landing />
                </SignedOut>
                <SignedIn>
                  <Library />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/workouts"
            element={
              <SignedIn>
                <Workouts />
              </SignedIn>
            }
          />
          <Route
            path="/workout/:id"
            element={
              <SignedIn>
                <Player />
              </SignedIn>
            }
          />
          <Route
            path="/progress"
            element={
              <SignedIn>
                <Progress />
              </SignedIn>
            }
          />
          <Route
            path="/profile"
            element={
              <SignedIn>
                <Profile />
              </SignedIn>
            }
          />
          <Route
            path="/profile/favorites"
            element={
              <SignedIn>
                <Favorites />
              </SignedIn>
            }
          />
          <Route
            path="/admin"
            element={
              <SignedIn>
                <Admin />
              </SignedIn>
            }
          />
          <Route
            path="/subscribe"
            element={
              <SignedIn>
                <Subscribe />
              </SignedIn>
            }
          />
          <Route
            path="/subscribe/success"
            element={
              <SignedIn>
                <SubscribeSuccess />
              </SignedIn>
            }
          />
        </Routes>
      </ClerkLoaded>
    </>
  );
}
