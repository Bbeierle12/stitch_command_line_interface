/**
 * MetricCard Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard, MetricRow } from '../components/MetricCard';
import { Shield } from 'lucide-react';

describe('MetricCard', () => {
  it('should render title', () => {
    render(
      <MetricCard title="Test Card">
        <div>Content</div>
      </MetricCard>
    );
    
  expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    const { container } = render(
      <MetricCard title="Test" icon={Shield}>
        <div>Content</div>
      </MetricCard>
    );
    
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render children', () => {
 render(
      <MetricCard title="Test">
        <div data-testid="child-content">Child Content</div>
      </MetricCard>
    );
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <MetricCard title="Test" loading>
        <div>Content</div>
   </MetricCard>
    );
    
    // Loading skeleton should be visible, content should not
 expect(screen.queryByText('Content')).not.toBeInTheDocument();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should apply accent color classes', () => {
    const { container } = render(
      <MetricCard title="Test" accent="danger" icon={Shield}>
     <div>Content</div>
    </MetricCard>
);
    
    expect(container.querySelector('.text-danger')).toBeInTheDocument();
  });

  it('should default to cyan accent', () => {
    const { container } = render(
      <MetricCard title="Test" icon={Shield}>
        <div>Content</div>
      </MetricCard>
    );
    
    expect(container.querySelector('.text-cyan')).toBeInTheDocument();
  });
});

describe('MetricRow', () => {
  it('should render label and value', () => {
    render(<MetricRow label="CPU" value="45%" />);
 
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('should render ReactNode as value', () => {
    render(
      <MetricRow 
        label="Status" 
        value={<span data-testid="custom-value">Active</span>} 
      />
    );
    
    expect(screen.getByTestId('custom-value')).toBeInTheDocument();
});

  it('should apply accent color', () => {
    const { container } = render(
      <MetricRow label="Error" value="Critical" accent="danger" />
    );
    
    expect(container.querySelector('.text-danger')).toBeInTheDocument();
  });

  it('should default to default accent', () => {
    const { container } = render(
      <MetricRow label="Info" value="Normal" />
    );
    
    expect(container.querySelector('.text-white\\/90')).toBeInTheDocument();
  });
});
