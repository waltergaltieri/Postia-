import { render, screen } from '@testing-library/react';
import ContentVersionComparator from '../content/ContentVersionComparator';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockVersions = [
  {
    id: 'v1',
    versionNumber: 1,
    finalImageUrl: 'test-image-1.jpg',
    publicationText: 'Test publication text 1',
    hashtags: ['test1', 'hashtag1'],
    cta: 'Test CTA 1',
    createdAt: new Date().toISOString(),
    isActive: false,
    tokensUsed: 100,
    generationMethod: 'AI' as const,
    changesSummary: 'Initial generation'
  },
  {
    id: 'v2',
    versionNumber: 2,
    finalImageUrl: 'test-image-2.jpg',
    publicationText: 'Test publication text 2',
    hashtags: ['test2', 'hashtag2'],
    cta: 'Test CTA 2',
    createdAt: new Date().toISOString(),
    isActive: true,
    tokensUsed: 150,
    generationMethod: 'MANUAL' as const,
    changesSummary: 'Manual refinement'
  }
];

describe('ContentVersionComparator', () => {
  it('renders empty state when no versions selected', () => {
    render(<ContentVersionComparator versions={mockVersions} />);
    expect(screen.getByText('Select Versions to Compare')).toBeInTheDocument();
  });

  it('renders comparison when versions are selected', () => {
    render(
      <ContentVersionComparator 
        versions={mockVersions} 
        selectedVersionIds={['v1', 'v2']}
      />
    );
    expect(screen.getByText('Version Comparison')).toBeInTheDocument();
    expect(screen.getByText('Version 1')).toBeInTheDocument();
    expect(screen.getByText('Version 2')).toBeInTheDocument();
  });

  it('displays version content correctly', () => {
    render(
      <ContentVersionComparator 
        versions={mockVersions} 
        selectedVersionIds={['v1', 'v2']}
      />
    );
    expect(screen.getByText('Test publication text 1')).toBeInTheDocument();
    expect(screen.getByText('Test publication text 2')).toBeInTheDocument();
  });

  it('shows generation method badges', () => {
    render(
      <ContentVersionComparator 
        versions={mockVersions} 
        selectedVersionIds={['v1', 'v2']}
      />
    );
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('MANUAL')).toBeInTheDocument();
  });
});