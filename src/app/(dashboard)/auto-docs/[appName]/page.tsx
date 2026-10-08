import React from 'react';
import ViewerClient from './ViewerClient';

export default async function AutoDocsViewerPage({ params }: { params: Promise<{ appName: string }> }) {
  const resolvedParams = await params;
  return <ViewerClient appName={resolvedParams.appName} />;
}
