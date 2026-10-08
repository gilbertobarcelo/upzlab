import React from 'react';
import PublicDocsLabClient from '../PublicDocsLabClient';

export default async function PreviewPage({ params }: { params: Promise<{ appName: string }> }) {
  const resolvedParams = await params;
  const decodedAppName = decodeURIComponent(resolvedParams.appName);
  return <PublicDocsLabClient appName={decodedAppName} isPreview={true} />;
}
