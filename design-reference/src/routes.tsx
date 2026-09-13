import { createBrowserRouter } from "react-router";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Intake from "./pages/Intake";
import Loading from "./pages/Loading";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";

export const router = createBrowserRouter([
  { path: "/", Component: Landing },
  { path: "/auth", Component: Auth },
  { path: "/intake", Component: Intake },
  { path: "/loading", Component: Loading },
  { path: "/results", Component: Results },
  { path: "/dashboard", Component: Dashboard },
]);
