"use client";

import { Slide, ToastContainer } from "react-toastify";

/**
 * react-toastify host. `theme="colored"` paints errors red and successes green.
 * Used by the auth flow; the rest of the app still toasts through Sonner.
 */
export function ToastifyContainer() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      pauseOnFocusLoss
      draggable
      theme="colored"
      transition={Slide}
    />
  );
}
