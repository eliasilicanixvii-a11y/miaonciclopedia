/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import EditArticle from './pages/EditArticle';
import Search from './pages/Search';
import Profile from './pages/Profile';
import RandomArticle from './pages/RandomArticle';
import IdeaGenerator from './pages/IdeaGenerator';
import AdminPanel from './pages/AdminPanel';
import NonsensePage from './pages/NonsensePage';
import Portal from './pages/Portal';
import AllPages from './pages/AllPages';
import CreatePortal from './pages/CreatePortal';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="article/:slug" element={<ArticleDetail />} />
            <Route path="edit/:id" element={<EditArticle />} />
            <Route path="search" element={<Search />} />
            <Route path="profile/:id" element={<Profile />} />
            <Route path="random" element={<RandomArticle />} />
            <Route path="ideas" element={<IdeaGenerator />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="nonsense/:id" element={<NonsensePage />} />
            <Route path="portal/:categorySlug" element={<Portal />} />
            <Route path="all-pages" element={<AllPages />} />
            <Route path="create-portal" element={<CreatePortal />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
