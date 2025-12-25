import { DocumentUpload } from '@/components/DocumentUpload';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useLanguage } from '@/contexts/LanguageContext';

interface KnowledgeBaseTabProps {
  workspaceId?: string;
  projectId?: string;
  projectName?: string;
}

export function KnowledgeBaseTab({ workspaceId, projectId, projectName }: KnowledgeBaseTabProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Document Upload Section */}
        <DocumentUpload workspaceId={workspaceId} projectId={projectId} />

        {/* AI Configuration Section */}
        <SettingsPanel />
      </div>
    </div>
  );
}
