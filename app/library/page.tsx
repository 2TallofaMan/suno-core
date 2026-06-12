'use client';

import { useState } from 'react';
import { useProjectsStore } from '../../store/projectsStore';
import { Track } from '../../types';
import Link from 'next/link';
import { generateTrackName } from '../../lib/audioUtils';

export default function LibraryPage() {
  const { projects, currentProjectId, setCurrentProject, addProject } = useProjectsStore();
  const [newProjectName, setNewProjectName] = useState('');

  const currentProject = projects.find((p: any) => p.id === currentProjectId);

  const handleNewProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject: any = {
      id: `proj_${Date.now()}`,
      name: newProjectName,
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tracks: [],
    };
    
    addProject(newProject);
    setCurrentProject(newProject.id);
    setNewProjectName('');
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Library
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your projects and tracks
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name"
              className="input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleNewProject();
              }}
            />
            <button
              onClick={handleNewProject}
              className="btn btn-primary px-4"
            >
              Create
            </button>
          </div>
        </header>

        {/* Projects List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`card cursor-pointer transition-all ${
                currentProjectId === project.id
                  ? 'ring-2 ring-blue-500'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => setCurrentProject(project.id)}
            >
              <h3 className="font-semibold truncate">{project.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {project.tracks.length} tracks
              </p>
            </div>
          ))}
        </div>

        {/* Current Project Tracks */}
        {currentProject && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {currentProject.name}
              </h2>
              <Link
                href="/create"
                className="btn btn-primary"
              >
                + New Track
              </Link>
            </div>
            
            {currentProject.tracks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No tracks yet. Create your first track!
              </p>
            ) : (
              <div className="track-list">
                {currentProject.tracks.map((track: any) => (
                  <div key={track.id} className="track-item">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{track.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {track.duration}s - {new Date(track.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        href={`/edit/${track.id}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                    <audio
                      src={track.audioUrl}
                      controls
                      className="w-full mt-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
