import { useState, useRef } from 'react';
import { Upload, Trash2, Loader2, FileText, FileType, Image, FileCode, FileSpreadsheet, CloudUpload, Sparkles, FolderOpen, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  created_at: string;
  content?: string | null;
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
const OCR_SUPPORTED_TYPES = [...IMAGE_TYPES, 'application/pdf'];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface DocumentUploadProps {
  workspaceId?: string;
  projectId?: string;
}

export function DocumentUpload({ workspaceId, projectId }: DocumentUploadProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [ocrProcessingId, setOcrProcessingId] = useState<string | null>(null);

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
        content = `[IMAGE: ${file.name}] Visual content - use OCR to extract text.`;
      } else if (file.type === 'application/pdf') {
        content = `[PDF: ${file.name}] Document uploaded - use OCR to extract text.`;
      } else {
        content = `[${file.type}] File uploaded for analysis.`;
      }

      const { data: insertedDoc, error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        workspace_id: workspaceId ?? null,
        project_id: projectId ?? null,
        file_name: file.name,
        file_type: file.type,
        file_path: filePath,
        file_size: file.size,
        content,
      }).select().single();

      if (dbError) throw dbError;
      return insertedDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(t('fileUploaded'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('uploadFailed'));
    },
  });

  const ocrMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('ocr-extract', {
        body: { documentId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) throw new Error(response.error.message || 'OCR processing failed');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(language === 'ar' ? 'تم استخراج النص بنجاح' : 'Text extracted successfully');
      setOcrProcessingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'OCR processing failed');
      setOcrProcessingId(null);
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
    await processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (files: File[]) => {
    setIsUploading(true);
    for (const file of files) {
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
  };

  const handleOCR = async (doc: Document) => {
    setOcrProcessingId(doc.id);
    ocrMutation.mutate(doc.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileType className="h-5 w-5 text-destructive" />;
    if (type.includes('image')) return <Image className="h-5 w-5 text-success" />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
      return <FileSpreadsheet className="h-5 w-5 text-success" />;
    if (type.includes('json') || type.includes('xml') || type.includes('html'))
      return <FileCode className="h-5 w-5 text-secondary" />;
    return <FileText className="h-5 w-5 text-primary" />;
  };

  const getFileTypeBadge = (type: string) => {
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('image')) return 'Image';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'Excel';
    if (type.includes('csv')) return 'CSV';
    if (type.includes('json')) return 'JSON';
    if (type.includes('xml')) return 'XML';
    if (type.includes('word') || type.includes('document')) return 'Word';
    if (type.includes('text') || type.includes('plain')) return 'Text';
    return 'File';
  };

  const canPerformOCR = (doc: Document) => {
    return OCR_SUPPORTED_TYPES.includes(doc.file_type);
  };

  const hasExtractedContent = (doc: Document) => {
    return doc.content && !doc.content.startsWith('[IMAGE:') && !doc.content.startsWith('[PDF:');
  };

  return (
    <Card className="glass-morphism border-primary/20 shadow-card overflow-hidden">
      <CardHeader className="bg-gradient-hero pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
            <CloudUpload className="h-5 w-5 text-primary-foreground" />
          </div>
          {t('knowledgeBase')}
        </CardTitle>
        <CardDescription className="text-muted-foreground/80">
          {t('knowledgeBaseDescription')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group",
            isDragging 
              ? "border-primary bg-primary/10 scale-[1.02]" 
              : "border-primary/30 bg-muted/30 hover:bg-muted/50 hover:border-primary/50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx,.doc,.md,.csv,.json,.xml,.html,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.webp,.svg"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="relative">
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-primary/10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
                <p className="text-primary font-medium">{t('uploading')}...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300",
                  isDragging 
                    ? "bg-primary/20 scale-110" 
                    : "bg-gradient-to-br from-primary/10 to-accent/10 group-hover:scale-105"
                )}>
                  <Upload className={cn(
                    "h-10 w-10 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  )} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t('dragDropFiles')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('clickToBrowse')}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {['PDF', 'Word', 'Excel', 'Images', 'JSON', 'CSV'].map((type) => (
                    <Badge 
                      key={type} 
                      variant="secondary" 
                      className="bg-muted/60 text-muted-foreground text-xs"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
                {/* OCR Info */}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <ScanText className="h-4 w-4" />
                  <span>{language === 'ar' ? 'يدعم OCR للعربية والإنجليزية' : 'OCR support for Arabic & English'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              {t('uploadedDocuments')}
            </h4>
            {documents.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {documents.length} {documents.length === 1 ? 'file' : 'files'}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t('loading')}...</p>
              </div>
            </div>
          ) : documents.length > 0 ? (
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div
                    key={doc.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border bg-card/50 backdrop-blur-sm",
                      "hover:bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200",
                      "animate-fade-in"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-muted/60">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium truncate max-w-[140px] sm:max-w-[200px]">
                          {doc.file_name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            {getFileTypeBadge(doc.file_type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </span>
                          {hasExtractedContent(doc) && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-success/20 text-success">
                              OCR ✓
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* OCR Button */}
                      {canPerformOCR(doc) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOCR(doc)}
                          disabled={ocrProcessingId === doc.id}
                          className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors"
                          title={language === 'ar' ? 'استخراج النص (OCR)' : 'Extract Text (OCR)'}
                        >
                          {ocrProcessingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ScanText className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(doc)}
                        disabled={deleteMutation.isPending}
                        className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-2xl bg-muted/40 mb-4">
                <Sparkles className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('noDocuments')}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {t('uploadToGetStarted')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
