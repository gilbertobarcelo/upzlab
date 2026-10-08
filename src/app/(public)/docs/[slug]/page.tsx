import React from 'react';
import DocsClient from '../DocsClient';

export default async function SingleDocPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return <DocsClient activeSlug={resolvedParams.slug} />;
}
