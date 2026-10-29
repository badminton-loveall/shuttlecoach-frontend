import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "./components/layout/Layout";
import { HomePage } from "./pages/Home";
import { FeaturesPage } from "./pages/Features";
import { RolesPage } from "./pages/Roles";
import { SportsPage } from "./pages/Sports";
import { PricingPage } from "./pages/Pricing";
import { AboutPage } from "./pages/About";
import { ContactPage } from "./pages/Contact";
import { LoginPage } from "./pages/Login";
import { StyleGuidePage } from "./pages/StyleGuide";
import { NotFoundPage } from "./pages/NotFound";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="sports" element={<SportsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="style-guide" element={<StyleGuidePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>);

}