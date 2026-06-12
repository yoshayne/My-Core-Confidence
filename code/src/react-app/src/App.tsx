import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Landing from "./pages/Landing";
import SsoCallback from "./pages/SsoCallback";
import Library from "./pages/Library";
import Workouts from "./pages/Workouts";
import Player from "./pages/Player";
import Subscribe from "./pages/Subscribe";
import ComingSoon from "./pages/ComingSoon";

export default function App() {
  return (
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
            <ComingSoon title="Progress" />
          </SignedIn>
        }
      />
      <Route
        path="/profile"
        element={
          <SignedIn>
            <ComingSoon title="Profile" />
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
    </Routes>
  );
}
