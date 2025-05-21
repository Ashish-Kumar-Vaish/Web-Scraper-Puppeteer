import { createBrowserRouter, RouterProvider } from "react-router";
import Events from "./pages/events/Events";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Events />,
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
