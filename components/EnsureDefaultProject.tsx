'use client';

import { useEffect } from 'react';
import { useProjectsStore } from '../store/projectsStore';

export default function EnsureDefaultProject() {
  const { projects, currentProjectId, addProject, setCurrentProject } = useProjectsStore();

  useEffect(() => {
    // If no projects and no current project, create a default one
    if (projects.length === 0 && !currentProjectId) {
      const defaultProject = {
        id: 'default',
        name: 'My First Project',
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tracks: [],
      };
      addProject(defaultProject);
      setCurrentProject('default');
    }
    // If there are projects but no current one, select the first
    else if (projects.length > 0 && !currentProjectId) {
      setCurrentProject(projects[0].id);
    }
  }, [projects, currentProjectId, addProject, setCurrentProject]);

  return null;
}
