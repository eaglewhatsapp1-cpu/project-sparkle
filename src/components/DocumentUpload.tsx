import { useState, useRef } from 'react';
import { Upload, Trash2, Loader2, FileText, FileType, Image, FileCode, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  created_at: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/xml',
  'application/json',
  'application/xml',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface DocumentUploadProps {
  workspaceId?: string;
  projectId?: string;
}

export function DocumentUpload({ workspaceId, projectId }: DocumentUploadProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', user?.id, workspaceId, projectId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectId) query = query.eq('project_id', projectId);
      else if (workspaceId) query = query.eq('workspace_id', workspaceId);

      const { data, error } = await query;
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');

      const fileExtension = file.name.split('.').pop() || '';
      const safeFileName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `${user.id}/${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      let content: string | null = null;
      const textTypes = ['text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/xml', 'application/json', 'application/xml'];

      if (textTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.json')) {
        content = await file.text();
      } else if (IMAGE_TYPES.includes(file.type)) {
        content = `[IMAGE: ${file.name}] Visual content available for AI analysis.`;
      } else {
        content = `[${file.type}] File uploaded for analysis.`;
      }

      const { error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        workspace_id: workspaceId ?? null,
        project_id: projectId ?? null,
        file_name: file.name,
        file_type: file.type,
        file_path: filePath,
        file_size: file.size,
        content,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(t('fileUploaded'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('uploadFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: Document) => {
      if (!user) throw new Error('Not authenticated');

      if (doc.file_path) {
        await supabase.storage.from('user-documents').remove([doc.file_path]);
      }

      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(t('fileDeleted'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('deleteFailed'));
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: ${t('invalidFileType')}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: ${t('fileTooLarge')}`);
        continue;
      }
      await uploadMutation.mutateAsync(file);
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileType className="h-4 w-4 text-destructive" />;
    if (type.includes('image')) return <Image className="h-4 w-4 text-green-500" />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
    if (type.includes('json') || type.includes('xml') || type.includes('html'))
      return <FileCode className="h-4 w-4 text-blue-500" />;
    return <FileText className="h-4 w-4 text-primary" />;
  };

  return (
    <Card className="border-primary/20 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          {t('knowledgeBase')}
        </CardTitle>
        <CardDescription>{t('knowledgeBaseDescription')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer bg-muted hover:bg-muted/80 transition-colors border-primary/30"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx,.doc,.md,.csv,.json,.xml,.html,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.webp,.svg"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          {isUploading ? (
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          )}
          <p className="mt-2 text-muted-foreground">{t('dragDropFiles')}</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            PDF, Word, Text, Images, CSV, JSON, XML
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : documents.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.file_type)}
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(doc)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            {t('noDocuments')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
