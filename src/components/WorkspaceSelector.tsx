import { useState, useEffect } from 'react';
import { Plus, FolderOpen, ChevronDown, Building2, Loader2, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  workspace_id: string | null;
  created_at: string;
}

interface WorkspaceSelectorProps {
  selectedWorkspace: Workspace | null;
  selectedProject: Project | null;
  onWorkspaceChange: (workspace: Workspace | null) => void;
  onProjectChange: (project: Project | null) => void;
}

export function WorkspaceSelector({
  selectedWorkspace,
  selectedProject,
  onWorkspaceChange,
  onProjectChange,
}: WorkspaceSelectorProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Fetch workspaces
  const { data: workspaces = [], isLoading: loadingWorkspaces } = useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Workspace[];
    },
    enabled: !!user,
  });

  // Fetch projects for selected workspace
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', user?.id, selectedWorkspace?.id],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (selectedWorkspace) {
        query = query.eq('workspace_id', selectedWorkspace.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });

  // Create workspace
  const createWorkspaceMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('workspaces')
        .insert({ user_id: user.id, name: newName, description: newDescription || null })
        .select()
        .single();
      if (error) throw error;
      return data as Workspace;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      onWorkspaceChange(data);
      setShowCreateWorkspace(false);
      setNewName('');
      setNewDescription('');
      toast.success(t('workspaceCreated'));
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Create project
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          workspace_id: selectedWorkspace?.id ?? null,
          name: newName,
          description: newDescription || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onProjectChange(data);
      setShowCreateProject(false);
      setNewName('');
      setNewDescription('');
      toast.success(t('projectCreated'));
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete workspace
  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspaces').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      if (selectedWorkspace) onWorkspaceChange(null);
      toast.success(t('workspaceDeleted'));
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete project
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (selectedProject) onProjectChange(null);
      toast.success(t('projectDeleted'));
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (!selectedWorkspace && workspaces.length > 0) {
      onWorkspaceChange(workspaces[0]);
    }
  }, [workspaces, selectedWorkspace, onWorkspaceChange]);

  // Auto-select first project when workspace changes
  useEffect(() => {
    if (selectedWorkspace && projects.length > 0 && !selectedProject) {
      onProjectChange(projects[0]);
    } else if (selectedWorkspace && projects.length === 0) {
      onProjectChange(null);
    }
  }, [projects, selectedWorkspace, selectedProject, onProjectChange]);

  return (
    <div className="flex items-center gap-2">
      {/* Workspace Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 min-w-[140px] justify-between">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="truncate max-w-[100px]">
              {loadingWorkspaces ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                selectedWorkspace?.name || t('selectWorkspace')
              )}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => {
                onWorkspaceChange(ws);
                onProjectChange(null);
              }}
              className="justify-between"
            >
              <span className="truncate">{ws.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteWorkspaceMutation.mutate(ws.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreateWorkspace(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newWorkspace')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Project Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 min-w-[140px] justify-between">
            <FolderOpen className="h-4 w-4 text-primary" />
            <span className="truncate max-w-[100px]">
              {loadingProjects ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                selectedProject?.name || t('selectProject')
              )}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {projects.map((proj) => (
            <DropdownMenuItem
              key={proj.id}
              onClick={() => onProjectChange(proj)}
              className="justify-between"
            >
              <span className="truncate">{proj.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteProjectMutation.mutate(proj.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreateProject(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newProject')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Workspace Dialog */}
      <Dialog open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createWorkspace')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder={t('workspaceName')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder={t('description')}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateWorkspace(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={() => createWorkspaceMutation.mutate()}
              disabled={!newName.trim() || createWorkspaceMutation.isPending}
            >
              {createWorkspaceMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createProject')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder={t('projectName')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder={t('description')}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateProject(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={() => createProjectMutation.mutate()}
              disabled={!newName.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
