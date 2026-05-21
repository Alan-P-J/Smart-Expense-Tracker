import { Tag } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export function CategoriesPage() {
  return (
    <EmptyState
      icon={Tag}
      title="Categories coming soon"
      description="Category management will appear here in a later day."
    />
  );
}
