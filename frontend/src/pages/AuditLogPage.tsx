import { ClipboardList } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export function AuditLogPage() {
  return (
    <EmptyState
      icon={ClipboardList}
      title="Audit log coming soon"
      description="A searchable trail of every CREATE / UPDATE / DELETE will appear here."
    />
  );
}
