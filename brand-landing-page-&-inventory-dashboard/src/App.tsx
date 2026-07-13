/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import AdminDashboard from "./components/AdminDashboard";
import { UserRole } from "./types";
import { seedDatabaseIfEmpty } from "./lib/dbService";

export default function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("viewer");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  // Seed the Firestore database if empty when application loads
  useEffect(() => {
    const initializeAppDatabase = async () => {
      try {
        await seedDatabaseIfEmpty();
      } catch (err) {
        console.error("Failed to seed initial database:", err);
      }
    };
    initializeAppDatabase();
  }, []);

  const handleOpenAdmin = (role: UserRole, email: string, name: string) => {
    setCurrentRole(role);
    setUserEmail(email);
    setUserName(name);
    setIsAdminLoggedIn(true);
  };

  const handleLogoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setCurrentRole("viewer");
    setUserEmail("");
    setUserName("");
  };

  return (
    <div id="app-root" className="min-h-screen bg-neutral-50">
      {isAdminLoggedIn ? (
        <AdminDashboard 
          currentRole={currentRole}
          userEmail={userEmail}
          userName={userName}
          onLogout={handleLogoutAdmin}
        />
      ) : (
        <LandingPage 
          onOpenAdmin={handleOpenAdmin}
        />
      )}
    </div>
  );
}
