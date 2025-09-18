import { render, screen } from '@testing-library/react';
import AIGenerationWorkflow from '../content/AIGenerationWorkflow';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockJob = {
  id: 'test-job',
  status: 'IN_PROGRESS' as const,
  tokensConsumed: 500,
  estimatedTotalTokens: 1000,
  createdAt: new Date().toISOString(),
  steps: [
    {
      step: 'IDEA_GENERATION' as const,
      status: 'COMPLETED' as const,
      tokensUsed: 150,
      executedAt: new Date().toISOString(),
      output: 'Test idea',
      duration: 5000
    },
    {
      step: 'COPY_DESIGN' as const,
      status: 'IN_PROGRESS' as const,
      tokensUsed: 100,
      duration: 3000
    }
  ],
  brandContext: {}
};

describe('AIGenerationWorkflow', () => {
  it('renders without job', () => {
    render(<AIGenerationWorkflow />);
    expect(screen.getByText('Ready to Generate')).toBeInTheDocument();
  });

  it('renders with job in progress', () => {
    render(<AIGenerationWorkflow job={mockJob} />);
    expect(screen.getByText('AI Generation Workflow')).toBeInTheDocument();
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    expect(screen.getByText('Tokens Used')).toBeInTheDocument();
  });

  it('displays correct progress percentage', () => {
    render(<AIGenerationWorkflow job={mockJob} />);
    // 1 completed step out of 2 total = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows token usage information', () => {
    render(<AIGenerationWorkflow job={mockJob} />);
    expect(screen.getByText('500 / 1,000')).toBeInTheDocument();
  });
});