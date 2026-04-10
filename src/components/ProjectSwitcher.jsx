import { useState } from 'react';
import { useProjectStore } from '../store/projectStore';

export default function ProjectSwitcher() {
  const { projects, activeProjectId, setActiveProject, createProject } = useProjectStore();
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) {
      return;
    }

    createProject(name);
    setNewName('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={activeProjectId || ''}
        onChange={(event) => setActiveProject(event.target.value || null)}
        className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
      >
        <option value="">Select Project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>

      <input
        value={newName}
        onChange={(event) => setNewName(event.target.value)}
        placeholder="New project name"
        className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
      />

      <button
        onClick={handleCreate}
        className="rounded-lg bg-slate-900 px-2 py-1 text-sm font-semibold text-white hover:bg-slate-800"
      >
        New Project
      </button>
    </div>
  );
}
