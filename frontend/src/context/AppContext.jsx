import React, { createContext, useContext, useRef, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [toastMsg, setToastMsg] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const timerRef = useRef(null);

  function toast(msg) {
    setToastMsg(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToastMsg(null), 2600);
  }

  function openConfirm(data) {
    setConfirmData(data);
  }
  function closeConfirm() {
    setConfirmData(null);
  }

  return (
    <AppContext.Provider value={{ toast, toastMsg, openConfirm, closeConfirm, confirmData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
