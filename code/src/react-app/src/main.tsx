import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const root = createRoot(document.getElementById("root")!);

if (!clerkPublishableKey) {
  root.render(
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-center text-text-secondary">
      Missing VITE_CLERK_PUBLISHABLE_KEY — set it to enable sign-up/sign-in.
    </div>
  );
} else {
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </StrictMode>
  );
}
