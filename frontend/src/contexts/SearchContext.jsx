import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import { useAuth } from './AuthContext';

const SearchContext = createContext(null);

/**
 * SearchProvider — pre-fetches and caches searchable data for global search.
 * Only loads data for Admin/Administration roles to avoid unnecessary requests.
 */
export const SearchProvider = ({ children }) => {
  const { user } = useAuth();
  const [index, setIndex] = useState({ students: [], teachers: [], classes: [] });
  const [loading, setLoading] = useState(false);

  const buildIndex = useCallback(async () => {
    const role = user?.role?.name;
    if (!role || (role !== 'Admin' && role !== 'Administration')) return;

    setLoading(true);
    try {
      const [studentsRes, teachersRes, classesRes] = await Promise.all([
        api.get('/students'),
        api.get('/teachers'),
        api.get('/classes'),
      ]);
      setIndex({
        students: studentsRes.data || [],
        teachers: teachersRes.data || [],
        classes: classesRes.data || [],
      });
    } catch {
      // fail silently — search just won't work
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    buildIndex();
  }, [buildIndex]);

  /**
   * search(query) → array of { type, id, title, subtitle, href }
   */
  const search = useCallback((query) => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();

    const results = [];

    index.students.forEach(s => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      const email = (s.email || '').toLowerCase();
      if (name.includes(q) || email.includes(q)) {
        results.push({
          type: 'Student',
          id: s.id,
          title: `${s.first_name} ${s.last_name}`,
          subtitle: `${s.classe?.name || 'No class'} · ${s.email}`,
          href: '/students',
        });
      }
    });

    index.teachers.forEach(t => {
      const name = `${t.first_name} ${t.last_name}`.toLowerCase();
      const email = (t.email || '').toLowerCase();
      if (name.includes(q) || email.includes(q)) {
        results.push({
          type: 'Teacher',
          id: t.id,
          title: `${t.first_name} ${t.last_name}`,
          subtitle: `${t.subject?.name || 'No subject'} · ${t.email}`,
          href: '/teachers',
        });
      }
    });

    index.classes.forEach(c => {
      if ((c.name || '').toLowerCase().includes(q)) {
        results.push({
          type: 'Class',
          id: c.id,
          title: c.name,
          subtitle: `${c.students_count ?? '?'} students`,
          href: '/classes',
        });
      }
    });

    return results.slice(0, 8); // cap at 8 results
  }, [index]);

  return (
    <SearchContext.Provider value={{ search, loading, index }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
