import { lazy, Suspense } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { PublicLayout } from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Dvgw from './pages/Dvgw';
import Services from './pages/Services';
import Process from './pages/Process';
import Requirements, { RequirementDetail } from './pages/Requirements';
import Resources, { ResourceDetail } from './pages/Resources';
import { ContactPage, FaqPage, ImageCredits, NotFound } from './pages/Misc';
import { AuthProvider } from './portal/auth';

// The client portal is loaded on demand so public pages stay light.
const PortalLayout = lazy(() => import('./portal/PortalLayout').then((m) => ({ default: m.PortalLayout })));
const Login = lazy(() => import('./portal/Dashboard').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('./portal/Dashboard').then((m) => ({ default: m.Dashboard })));
const Projects = lazy(() => import('./portal/Dashboard').then((m) => ({ default: m.Projects })));
const ProjectPage = lazy(() => import('./portal/Project').then((m) => ({ default: m.ProjectPage })));
const Inquiries = lazy(() => import('./portal/Admin').then((m) => ({ default: m.Inquiries })));
const AnalyticsPage = lazy(() => import('./portal/Admin').then((m) => ({ default: m.AnalyticsPage })));
const UsersPage = lazy(() => import('./portal/Admin').then((m) => ({ default: m.UsersPage })));

export function App() {
  return (
    <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen" />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="dvgw-certification" element={<Dvgw />} />
              <Route path="certification-requirements" element={<Requirements />} />
              <Route path="certification-requirements/:slug" element={<RequirementDetail />} />
              <Route path="services" element={<Services />} />
              <Route path="certification-process" element={<Process />} />
              <Route path="resources" element={<Resources />} />
              <Route path="resources/:slug" element={<ResourceDetail />} />
              <Route path="faq" element={<FaqPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="image-credits" element={<ImageCredits />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route element={<AuthProvider><Outlet /></AuthProvider>}>
            <Route path="portal/login" element={<Login />} />
            <Route path="portal" element={<PortalLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectPage />} />
              <Route path="inquiries" element={<Inquiries />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>
            </Route>
          </Routes>
        </Suspense>
    </BrowserRouter>
  );
}
