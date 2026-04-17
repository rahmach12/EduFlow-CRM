import React from 'react';

const PageComponent = ({ title }) => (
  <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-slate-200 dark:border-slate-700">
    <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{title} Management</h2>
    <p className="text-slate-600 dark:text-slate-400">This module is under development.</p>
  </div>
);

export const Students = () => <PageComponent title="Students" />;
export const Teachers = () => <PageComponent title="Teachers" />;
export const Classes = () => <PageComponent title="Classes" />;
export const Subjects = () => <PageComponent title="Subjects" />;
export const Notes = () => <PageComponent title="Grades & Notes" />;
export const Absences = () => <PageComponent title="Absences" />;
export const Finance = () => <PageComponent title="Finance" />;
