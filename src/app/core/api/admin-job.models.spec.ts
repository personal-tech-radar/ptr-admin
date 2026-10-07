import { cancellableStates, jobReferencePath } from './admin-job.models';

describe('administrative job links and safe cancellation states', () => {
  it('routes only known persisted references to their domain details', () => {
    expect(jobReferencePath({ type: 'source', id: 'source-id' })).toBe('/sources/source-id');
    expect(jobReferencePath({ type: 'article', id: 'article-id' })).toBe('/articles/article-id');
    expect(jobReferencePath({ type: 'candidate', id: 'candidate-id' })).toBe(
      '/sources/candidates/candidate-id',
    );
    expect(jobReferencePath({ type: 'taxonomy', id: 'taxonomy-id' })).toBe('/taxonomy/taxonomy-id');
    expect(jobReferencePath({ type: 'digest', id: 'digest-id' })).toBe('/digests/digest-id');
    expect(jobReferencePath({ type: 'user', id: 'user-id' })).toBe('/users/user-id');
    expect(jobReferencePath(null)).toBeNull();
  });

  it('does not offer cancellation for active or finished work', () => {
    expect(cancellableStates).toEqual(['waiting', 'delayed', 'paused', 'prioritized']);
    expect(cancellableStates).not.toContain('active');
    expect(cancellableStates).not.toContain('failed');
    expect(cancellableStates).not.toContain('completed');
  });
});
